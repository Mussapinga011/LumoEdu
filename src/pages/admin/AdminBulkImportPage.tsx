import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Copy, Save, Loader, 
  FileJson, CheckCircle2, AlertCircle, 
  Cpu, Rocket, Trash2, Edit3 
} from 'lucide-react';
import { useContentStore } from '../../stores/useContentStore';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { createExam, bulkImportQuestions } from '../../services/examService.supabase';
import clsx from 'clsx';
import RichTextRenderer from '../../components/RichTextRenderer';

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
Retorne APENAS um JSON válido (array de objetos) seguindo EXATAMENTE este formato.

IMPORTANTE:
1. No campo "options", extraia APENAS o texto da alternativa, SEM incluir a letra indicativa (A, B, C, etc) e sem parênteses.
2. O campo "correctOption" deve conter apenas a LETRA da alternativa correta (A, B, C, D ou E).
3. Se houver fórmulas matemáticas, mantenha em formato LaTeX entre cifras ($...$).
4. Ignore cabeçalhos repetitivos de páginas.

Exemplo de formato esperado:
[
  {
    "statement": "Qual é a capital de Moçambique?",
    "options": ["Maputo", "Beira", "Nampula", "Inhambane"],
    "correctOption": "A",
    "explanation": "Maputo é a capital e maior cidade..."
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
    showSuccess('Prompt copiado para a área de transferência!');
  };

  const handleParseJson = () => {
    try {
      let cleanJson = jsonInput.trim();
      // Remove markdowns if present
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```$/, '');
      }
      
      const parsed = JSON.parse(cleanJson);

      if (!Array.isArray(parsed)) throw new Error('O JSON deve ser um array de questões');

      const questions = parsed.map((q: any, index: number) => ({
        statement: normalizeLaTeX(q.statement),
        options: q.options.map((opt: string) => normalizeLaTeX(opt)),
        correctOption: q.correctOption,
        explanation: normalizeLaTeX(q.explanation || ''),
        order: index + 1
      }));

      setProcessedQuestions(questions);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      showError('Erro no JSON: ' + e.message);
    }
  };

  const handleImport = async () => {
    if (!selectedDiscipline || !examName) {
      showError('Preencha o nome do exame e a disciplina.');
      return;
    }

    setIsImporting(true);
    try {
      const examData = {
        discipline_id: selectedDiscipline,
        university_id: selectedUniversityId,
        title: examName,
        year: examYear,
        is_active: true
      };
      
      const newExam = await createExam(examData);
      await bulkImportQuestions(newExam.id, processedQuestions);

      showSuccess('Exame e questões importados com sucesso!');
      setTimeout(() => navigate('/admin/exams'), 1500);
    } catch (error: any) {
      showError(`Erro na importação: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  if (contentLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-400 font-bold">Preparando motor de importação...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-32 px-4 space-y-8 animate-in fade-in duration-500">
      {/* HEADER WIZARD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/exams')} className="p-3 bg-gray-50 text-gray-400 hover:text-primary rounded-2xl transition-all">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Importação de IA</h1>
            <p className="text-gray-500 font-medium">Transforme fotos de exames em dados estruturados.</p>
          </div>
        </div>

        <div className="flex items-center bg-gray-100 p-1.5 rounded-2xl gap-2">
           <div className={clsx(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
              step === 1 ? "bg-white text-primary shadow-sm" : "text-gray-400"
           )}>
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">1</span>
              JSON Data
           </div>
           <div className={clsx(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
              step === 2 ? "bg-white text-primary shadow-sm" : "text-gray-400"
           )}>
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">2</span>
              Revisão
           </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             {/* EXAM CORE INFO */}
             <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Rocket size={20}/></div>
                   <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">Informações do Exame</h3>
                </div>
                
                <input 
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 outline-none font-bold text-gray-700 transition-all" 
                  placeholder="Título do Exame (Ex: Admissão UEM 2024)" 
                  value={examName} 
                  onChange={e => setExamName(e.target.value)} 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 outline-none font-bold text-gray-700 transition-all appearance-none" value={selectedUniversityId} onChange={e => setSelectedUniversityId(e.target.value)}>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>)}
                  </select>
                  <select className="p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 outline-none font-bold text-gray-700 transition-all appearance-none" value={selectedDiscipline} onChange={e => setSelectedDiscipline(e.target.value)}>
                    <option value="">Escolher Disciplina...</option>
                    {disciplines.filter(d => d.universityId === selectedUniversityId).map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                </div>
             </div>

             {/* JSON INPUT */}
             <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                   <div className="flex items-center gap-2">
                      <FileJson size={18} className="text-primary" />
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Cole o JSON Gerado</span>
                   </div>
                   <button onClick={() => setJsonInput('')} className="text-[10px] font-black text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1">
                      <Trash2 size={12} /> Limpar
                   </button>
                </div>
                <div className="relative group">
                  <textarea 
                    className="w-full h-[30rem] p-8 bg-gray-900 text-emerald-400 font-mono text-xs rounded-[2.5rem] border-8 border-gray-800 focus:border-gray-700 outline-none shadow-2xl transition-all selection:bg-emerald-500/20"
                    placeholder="[ { 'statement': '...', 'options': [...] }, ... ]"
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                  />
                  <div className="absolute right-6 bottom-6 flex gap-2">
                     <button 
                        onClick={handleParseJson}
                        className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center gap-2"
                     >
                        <Cpu size={18} /> Processar Dados
                     </button>
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                <div className="text-center space-y-2">
                   <h3 className="text-xl font-black text-gray-800">Prompt Mestre</h3>
                   <p className="text-sm text-gray-500 font-medium leading-relaxed">Use este prompt no ChatGPT para que ele estruture as questões exatamente como o LumoEdu precisa.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 relative">
                   <pre className="text-[10px] font-mono whitespace-pre-wrap text-gray-400 max-h-40 overflow-y-auto">
                      {PROMPT_TEXT}
                   </pre>
                   <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent pointer-events-none" />
                </div>
                <button 
                  onClick={handleCopyPrompt} 
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-2xl font-extrabold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all group"
                >
                  <Copy size={20} className="group-active:scale-90 transition-transform" />
                  Copiar Prompt
                </button>
             </div>

             <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm"><CheckCircle2 size={32}/></div>
                <h4 className="text-emerald-800 font-black">Pronto para Importar?</h4>
                <p className="text-xs text-emerald-600 font-medium">Você pode revisar cada questão individualmente na próxima etapa antes de salvar no banco de dados.</p>
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 flex items-center justify-between shadow-xl shadow-emerald-500/5">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                   <CheckCircle2 size={32} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-gray-800">{processedQuestions.length} Questões Prontas!</h3>
                   <p className="text-gray-500 font-medium">Revise o conteúdo extraído abaixo antes da importação final.</p>
                </div>
             </div>
             <button onClick={() => setStep(1)} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm flex items-center gap-2">
                <Edit3 size={18} /> Editar JSON
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processedQuestions.map((q, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-all" />
                <div className="flex justify-between items-start mb-6">
                   <span className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      {q.order}
                   </span>
                   <div className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
                      Válida
                   </div>
                </div>
                
                <div className="space-y-6">
                   <div className="prose prose-sm text-gray-800 font-bold leading-relaxed">
                      <RichTextRenderer content={q.statement} />
                   </div>
                   
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Alternativas Extraídas:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt, i) => (
                          <div key={i} className={clsx(
                             "p-3 rounded-xl border text-xs font-medium flex items-center gap-3",
                             q.correctOption === String.fromCharCode(65 + i) || q.correctOption === opt
                                ? "bg-green-50 border-green-200 text-green-700 font-bold"
                                : "bg-gray-50 border-transparent text-gray-500"
                          )}>
                             <span className="opacity-40">{String.fromCharCode(65 + i)}</span>
                             <RichTextRenderer content={opt} />
                          </div>
                        ))}
                      </div>
                   </div>

                   {q.explanation && (
                     <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-[11px] text-blue-600 leading-relaxed italic">
                        <strong>Explicação:</strong> {q.explanation}
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 mt-12 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
             <div className="flex items-center gap-6">
                <div className="p-4 bg-yellow-50 text-yellow-600 rounded-[2rem]"><AlertCircle size={40}/></div>
                <div>
                   <h4 className="text-xl font-black text-gray-800 leading-none mb-1">Confirmação de Segurança</h4>
                   <p className="text-gray-500 font-medium">Ao confirmar, um novo exame será criado com todas estas questões.</p>
                </div>
             </div>
             <button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full md:w-auto bg-green-600 text-white px-16 py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 hover:bg-green-700 hover:-translate-y-1 active:translate-y-0 transition-all text-lg"
              >
                {isImporting ? <Loader className="animate-spin" /> : <Save size={24} />}
                CONFIRMAR E PUBLICAR
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
