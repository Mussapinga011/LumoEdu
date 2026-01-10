import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Save, Loader } from 'lucide-react';
import { useContentStore } from '../../stores/useContentStore';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { createExam, bulkImportQuestions } from '../../services/examService.supabase';

interface ProcessedQuestion {
  statement: string;
  options: string[];
  correctOption: string;
  explanation?: string;
  order: number;
}

const normalizeLaTeX = (text: string): string => {
  if (!text) return text;
  return text.replace(/\\\\/g, '\\');
};

const PROMPT_TEXT = `Atue como um especialista em OCR e estruturação de dados.
Analise as imagens fornecidas e extraia as questões deste exame de admissão.
Retorne um JSON válido (array de objetos) seguindo EXATAMENTE este formato:

[
  {
    "statement": "Texto completo do enunciado.",
    "options": ["A", "B", "C", "D"],
    "correctOption": "A",
    "explanation": "..."
  }
]`;

const AdminBulkImportPage = () => {
  const navigate = useNavigate();
  const { disciplines, universities, fetchContent, loading: contentLoading } = useContentStore();
  
  const { modalState, closeModal } = useModal();
  const { toastState, showSuccess, showError, closeToast } = useToast();

  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [examName, setExamName] = useState('');
  const [examYear] = useState(new Date().getFullYear());
  const [examSeason] = useState('1ª época');
  const [jsonInput, setJsonInput] = useState('');
  const [processedQuestions, setProcessedQuestions] = useState<ProcessedQuestion[]>([]);
  const [step, setStep] = useState(1);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (universities.length > 0 && !selectedUniversityId) {
      setSelectedUniversityId(universities[0].id);
    }
  }, [universities, selectedUniversityId]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEXT);
    showSuccess('Prompt copiado!');
  };

  const handleParseJson = () => {
    try {
      let cleanJson = jsonInput.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '');
      const parsed = JSON.parse(cleanJson);

      const questions = parsed.map((q: any, index: number) => ({
        statement: normalizeLaTeX(q.statement),
        options: q.options.map((opt: string) => normalizeLaTeX(opt)),
        correctOption: q.correctOption,
        explanation: normalizeLaTeX(q.explanation || ''),
        order: index + 1
      }));

      setProcessedQuestions(questions);
      setStep(2);
      showSuccess('JSON processado com sucesso!');
    } catch (e) {
      showError('Erro ao processar JSON. Verifique a sintaxe.');
    }
  };

  const handleImport = async () => {
    if (!selectedDiscipline || !examName) {
      showError('Preencha os dados do exame.');
      return;
    }

    setIsImporting(true);
    try {
      const examData = {
        discipline_id: selectedDiscipline,
        university_id: selectedUniversityId,
        title: examName,
        year: examYear,
        season: examSeason,
        questions_count: processedQuestions.length,
        is_active: true
      };
      
      const newExam = await createExam(examData);

      const questionsToImport = processedQuestions.map(pq => ({
        ...pq,
        disciplineId: selectedDiscipline
      }));

      await bulkImportQuestions(newExam.id, questionsToImport);

      showSuccess('Exame importado com sucesso!');
      setTimeout(() => navigate('/admin/exams'), 1500);
    } catch (error: any) {
      showError(`Erro na importação: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  if (contentLoading) return <div className="p-20 text-center text-gray-400 font-bold">Carregando dados...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/exams')} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Importação em Massa</h1>
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              className="md:col-span-2 p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
              placeholder="Nome do Exame" 
              value={examName} 
              onChange={e => setExamName(e.target.value)} 
            />
            <select className="p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" value={selectedUniversityId} onChange={e => setSelectedUniversityId(e.target.value)}>
              {universities.map(u => <option key={u.id} value={u.id}>{u.shortName}</option>)}
            </select>
            <select className="p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" value={selectedDiscipline} onChange={e => setSelectedDiscipline(e.target.value)}>
              <option value="">Disciplina...</option>
              {disciplines.filter(d => d.universityId === selectedUniversityId).map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
            <p className="text-blue-700 text-sm font-medium">Use o prompt abaixo para formatar as questões usando o ChatGPT/Claude.</p>
            <button onClick={handleCopyPrompt} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
              <Copy size={16} /> Copiar Prompt
            </button>
          </div>

          <textarea 
            className="w-full h-80 p-4 font-mono text-sm border rounded-xl focus:ring-2 focus:ring-primary outline-none"
            placeholder="Cole o JSON com as questões aqui..."
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
          />
          
          <button onClick={handleParseJson} className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:translate-y-1">
            Revisar Questões
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center bg-green-50 p-4 rounded-xl border border-green-100 mb-6">
             <p className="text-green-700 font-bold">{processedQuestions.length} questões encontradas!</p>
             <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 font-bold underline">Voltar para editar JSON</button>
          </div>
          {processedQuestions.map((q, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="font-black text-gray-400 text-xs mb-2 uppercase">Questão {q.order}</p>
              <p className="text-gray-700 font-medium mb-4">{q.statement}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                 {q.options.map((opt, i) => (
                   <div key={i} className={`p-2 rounded border ${q.correctOption === opt ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50'}`}>
                      {opt}
                   </div>
                 ))}
              </div>
            </div>
          ))}
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200 flex justify-end shadow-2xl z-50">
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="bg-green-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:translate-y-1"
            >
              {isImporting ? <Loader className="animate-spin" /> : <Save size={20} />}
              CONFIRMAR IMPORTAÇÃO
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} />
      {toastState.isOpen && <Toast message={toastState.message} type={toastState.type} onClose={closeToast} />}
    </div>
  );
};

export default AdminBulkImportPage;
