import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileJson, CheckCircle, Loader, ArrowLeft, Copy, ArrowRight, Save, Trash2, Plus } from 'lucide-react';
import { useContentStore } from '../../stores/useContentStore';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { createExam, bulkImportQuestions } from '../../services/dbService';
import { Question } from '../../types/exam';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface ProcessedQuestion {
  statement: string;
  options: string[];
  correctOption: string;
  explanation?: string;
  order: number;
}

// Utility function to normalize LaTeX by converting double backslashes to single
// This allows users to paste JSON with normal LaTeX format (\sin, \pi, etc.)
// instead of requiring escaped backslashes (\\sin, \\pi, etc.)
const normalizeLaTeX = (text: string): string => {
  if (!text) return text;
  // Replace double backslashes with single backslashes
  // This handles LaTeX commands like \\sin → \sin, \\frac → \frac, etc.
  return text.replace(/\\\\/g, '\\');
};
const PROMPT_TEXT = `Atue como um especialista em OCR e estruturação de dados.
Analise as imagens fornecidas e extraia as questões deste exame de admissão.
Retorne um JSON válido (array de objetos) seguindo EXATAMENTE este formato:

[
  {
    "statement": "Texto completo do enunciado. Use LaTeX para fórmulas matemáticas (Ex: \\\\frac{a}{b}).",
    "options": [
      "Texto da opção A",
      "Texto da opção B",
      "Texto da opção C",
      "Texto da opção D"
    ],
    "correctOption": "A", // A letra da alternativa correta (A, B, C ou D). Se tiver gabarito, use-o; senão, infira.
    "explanation": "Explicação breve da resolução (opcional)."
  }
]

REGRAS CRÍTICAS:
1. Retorne APENAS o JSON puro, sem formatação de markdown (sem \`\`\`json).
2. O JSON deve ser validável diretamente.
3. Para LaTeX, use duas barras invertidas (\\\\) para comandos. Ex: \\\\sin, \\\\pi, \\\\frac{a}{b}.
   NOTA: O sistema aceita ambos os formatos (\\\\sin ou \\sin) e converte automaticamente.
4. Mantenha as opções em ordem (A, B, C, D) no array.`;
const AdminBulkImportPage = () => {
  const navigate = useNavigate();
  const { disciplines, fetchDisciplines } = useContentStore();
  
  useEffect(() => {
    fetchDisciplines();
  }, [fetchDisciplines]);

  const { modalState, closeModal } = useModal();
  const { toastState, showSuccess, showError, closeToast } = useToast();

  // Seção 1: Dados do Exame
  const [selectedUniversity, setSelectedUniversity] = useState<'UEM' | 'UP'>('UEM');
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [examName, setExamName] = useState('');
  const [examYear, setExamYear] = useState(new Date().getFullYear());
  const [examSeason, setExamSeason] = useState('1ª época');

  // Seção 2: JSON Input
  const [jsonInput, setJsonInput] = useState('');
  
  // Seção 3: Questões Processadas
  const [processedQuestions, setProcessedQuestions] = useState<ProcessedQuestion[]>([]);
  const [step, setStep] = useState(1); // 1: Config & JSON, 2: Review

  // Importação
  const [isImporting, setIsImporting] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEXT);
    showSuccess('Prompt copiado! Cole no Gemini junto com as imagens do Exame e do Guia.');
  };

  const handleParseJson = () => {
    if (!jsonInput.trim()) {
      showError('Cole o JSON gerado pelo Gemini primeiro.');
      return;
    }

    try {
      // Tentar limpar markdown se o usuário colar com ```json
      let cleanJson = jsonInput.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json\s*/, '');
      if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```\s*/, '');
      if (cleanJson.endsWith('```')) cleanJson = cleanJson.replace(/\s*```$/, '');
      cleanJson = cleanJson.trim();
      
      // Tentar fazer o parse
      let parsed;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (parseError: any) {
        // Se falhar, tentar identificar o problema
        const errorMsg = parseError.message || '';
        
        if (errorMsg.includes('Bad escaped character') || errorMsg.includes('escape')) {
          showError(
            'Erro de caracteres escapados no JSON. ' +
            'Isso geralmente acontece com LaTeX. ' +
            'Certifique-se de que todas as barras invertidas (\\) no LaTeX estão duplicadas (\\\\). ' +
            'Exemplo: use \\\\frac ao invés de \\frac'
          );
        } else if (errorMsg.includes('Unexpected token')) {
          showError(
            'JSON inválido. Verifique se: ' +
            '1) Está entre colchetes [ ], ' +
            '2) Todas as aspas estão fechadas, ' +
            '3) Não há vírgulas extras no final'
          );
        } else {
          showError(`Erro ao ler JSON: ${errorMsg}`);
        }
        return;
      }

      if (!Array.isArray(parsed)) {
        throw new Error('O JSON deve ser uma lista (array) de questões.');
      }

      if (parsed.length === 0) {
        throw new Error('O JSON está vazio. Adicione pelo menos uma questão.');
      }

      // Validar estrutura básica e normalizar LaTeX
      const questions: ProcessedQuestion[] = parsed.map((q: any, index: number) => {
        if (!q.statement || !Array.isArray(q.options) || !q.correctOption) {
          throw new Error(`Questão ${index + 1} está incompleta (faltam campos obrigatórios).`);
        }
        
        // Validar que tem pelo menos 4 opções
        if (q.options.length < 4) {
          throw new Error(`Questão ${index + 1} precisa ter pelo menos 4 opções (A, B, C, D).`);
        }
        
        // Normalizar LaTeX: converter \\ para \ em todos os campos
        // Isso permite colar JSON com LaTeX normal sem precisar duplicar barras
        return {
          statement: normalizeLaTeX(q.statement),
          options: q.options.map((opt: string) => normalizeLaTeX(opt)),
          correctOption: q.correctOption,
          explanation: normalizeLaTeX(q.explanation || ''),
          order: index + 1
        };
      });

      setProcessedQuestions(questions);
      setStep(2); // Ir para revisão
      showSuccess(`${questions.length} questões carregadas com sucesso!`);
    } catch (error: any) {
      console.error('Erro no parsing:', error);
      showError(`Erro ao processar JSON: ${error.message}`);
    }
  };

  const handleUpdateQuestion = (index: number, field: keyof ProcessedQuestion, value: any) => {
    const updated = [...processedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setProcessedQuestions(updated);
  };

  const handleUpdateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...processedQuestions];
    updated[qIndex].options[oIndex] = value;
    setProcessedQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    if (window.confirm('Remover esta questão?')) {
      const updated = processedQuestions.filter((_, i) => i !== index);
      // Reordenar
      const reordered = updated.map((q, i) => ({ ...q, order: i + 1 }));
      setProcessedQuestions(reordered);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: ProcessedQuestion = {
      statement: 'Nova Questão',
      options: ['A', 'B', 'C', 'D'],
      correctOption: 'A',
      explanation: '',
      order: processedQuestions.length + 1
    };
    setProcessedQuestions([...processedQuestions, newQuestion]);
  };

  const handleImport = async () => {
    if (!selectedDiscipline) {
      showError('Selecione uma disciplina');
      return;
    }
    if (!examName) {
      showError('Digite o nome do exame');
      return;
    }

    setIsImporting(true);

    try {
      // 1. Obter a disciplina selecionada para derivar a universidade
      const selectedDisciplineObj = disciplines.find(d => d.id === selectedDiscipline);
      
      if (!selectedDisciplineObj) {
        showError('Disciplina não encontrada');
        return;
      }

      // 2. Criar exame com a universidade derivada da disciplina
      const examData: any = {
        disciplineId: selectedDiscipline,
        name: examName,
        year: examYear,
        season: examSeason,
        questionsCount: processedQuestions.length,
        description: `Importado via JSON - ${processedQuestions.length} questões`,
        university: selectedDisciplineObj.university // Derivado da disciplina
      };
      
      const examId = await createExam(examData);

      // 2. Converter e importar questões
      const questions: Omit<Question, 'id'>[] = processedQuestions.map(pq => ({
        examId,
        statement: pq.statement,
        options: pq.options,
        correctOption: pq.correctOption,
        explanation: pq.explanation,
        order: pq.order,
        disciplineId: selectedDiscipline
      }));

      await bulkImportQuestions(examId, questions);

      showSuccess('Exame importado com sucesso!');
      setTimeout(() => {
        navigate(`/admin/exams/${examId}/edit`);
      }, 1500);
    } catch (error: any) {
      console.error(error);
      showError(`Erro na importação: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/exams')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Importação via JSON (Gemini)</h1>
          <p className="text-gray-600">Copie o prompt, gere o JSON no Gemini e cole aqui.</p>
        </div>
      </div>

      {/* Step 1: Configuração e JSON */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Dados do Exame */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">1. Dados do Exame</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Exame</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="Ex: Exame 2024 - 1ª Época"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Universidade</label>
                <select
                  value={selectedUniversity}
                  onChange={(e) => {
                    setSelectedUniversity(e.target.value as 'UEM' | 'UP');
                    setSelectedDiscipline(''); // Reset discipline when university changes
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="UEM">UEM</option>
                  <option value="UP">UP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => setSelectedDiscipline(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Selecione...</option>
                  {disciplines
                    .filter(d => d.university === selectedUniversity)
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                <input
                  type="number"
                  value={examYear}
                  onChange={(e) => setExamYear(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Época</label>
                <input
                  type="text"
                  value={examSeason}
                  onChange={(e) => setExamSeason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Prompt Helper */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h2 className="text-lg font-semibold mb-2 text-blue-900 flex items-center gap-2">
              <FileJson size={20} />
              2. Gere as Questões no Gemini
            </h2>
            <p className="text-blue-700 mb-4 text-sm">
              Use este prompt no chat oficial do Gemini junto com as imagens do exame para gerar o código correto.
            </p>
            <div className="relative bg-white p-4 rounded-lg border border-blue-200 font-mono text-xs text-gray-600 overflow-x-auto">
              <pre>{PROMPT_TEXT}</pre>
              <button
                onClick={handleCopyPrompt}
                className="absolute top-2 right-2 flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-bold transition-colors"
              >
                <Copy size={14} /> Copiar Prompt
              </button>
            </div>
          </div>

          {/* JSON Input */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">3. Cole o JSON Aqui</h2>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Cole aqui o resultado do Gemini (começando com [ e terminando com ])'
              className="w-full h-64 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-y"
            />
            
            {/* Dicas */}
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 font-semibold mb-1">💡 Dicas para evitar erros:</p>
              <ul className="text-xs text-yellow-700 space-y-1 ml-4 list-disc">
                <li>✅ Pode colar LaTeX com sintaxe normal (<code className="bg-yellow-100 px-1 rounded">\sin</code>) ou duplicada (<code className="bg-yellow-100 px-1 rounded">\\sin</code>) - ambos funcionam!</li>
                <li>Remova qualquer texto antes do <code className="bg-yellow-100 px-1 rounded">[</code> e depois do <code className="bg-yellow-100 px-1 rounded">]</code></li>
                <li>Certifique-se de que todas as aspas estão fechadas corretamente</li>
              </ul>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleParseJson}
                disabled={!jsonInput.trim()}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
              >
                Carregar Questões
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Revisão */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Revisar {processedQuestions.length} Questões
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-2 px-4 py-2 text-primary bg-primary/10 rounded-lg hover:bg-primary/20"
              >
                <Plus size={20} /> Adicionar Manualmente
              </button>
              <button
                onClick={() => {
                   if(window.confirm('Voltar perderá as questões carregadas. Continuar?')) setStep(1);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Voltar
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {processedQuestions.map((question, qIndex) => (
              <div key={qIndex} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
                <div className="flex justify-between mb-4">
                  <span className="font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm">
                    Questão {question.order}
                  </span>
                  <button
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Enunciado */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enunciado</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <textarea
                        value={question.statement}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'statement', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm min-h-[100px]"
                      />
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm overflow-y-auto max-h-[150px]">
                        <p className="text-xs text-gray-400 mb-1">Preview:</p>
                        <InlineMath>{question.statement}</InlineMath>
                      </div>
                    </div>
                  </div>

                  {/* Alternativas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    {question.options.map((option, oIndex) => {
                      const letter = String.fromCharCode(65 + oIndex);
                      const isCorrect = question.correctOption === letter;
                      return (
                        <div key={oIndex} className="relative">
                           <div className={`flex items-center gap-2 mb-1 text-xs font-bold ${isCorrect ? 'text-green-600' : 'text-gray-500'}`}>
                             <span>Opção {letter}</span>
                             {isCorrect && <CheckCircle size={12} />}
                           </div>
                           <div className="flex flex-col gap-2 w-full">
                             <div className="flex gap-2">
                               <input
                                 type="text"
                                 value={option}
                                 onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                                 className={`w-full p-2 border rounded-lg outline-none text-sm ${isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                               />
                               <button
                                 onClick={() => handleUpdateQuestion(qIndex, 'correctOption', letter)}
                                 className={`px-3 rounded-lg border text-xs font-bold transition-all ${isCorrect ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-200'}`}
                               >
                                 {isCorrect ? 'Correta' : 'Marcar'}
                               </button>
                             </div>
                             {/* Preview da Opção */}
                             {option.trim() && (
                               <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600">
                                 <InlineMath>{option}</InlineMath>
                               </div>
                             )}
                           </div>
                        </div>
                      );
                    })}
                  </div>

                   {/* Explicação */}
                   <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Explicação (Opcional)</label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) => handleUpdateQuestion(qIndex, 'explanation', e.target.value)}
                      placeholder="Explicação da resposta..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm h-20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ação Final */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
            <div className="max-w-5xl mx-auto flex justify-end gap-4">
               <div className="flex-1 flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="mr-2 text-green-500"/>
                  {processedQuestions.length} questões prontas para importar
               </div>
               <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 disabled:opacity-70 transition-all font-bold shadow-lg shadow-green-200"
              >
                {isImporting ? <Loader className="animate-spin" /> : <Save size={20} />}
                {isImporting ? 'Importando...' : 'Finalizar Importação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal e Toast Components */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
      />
      {toastState.isOpen && (
        <Toast
          message={toastState.message}
          type={toastState.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default AdminBulkImportPage;
