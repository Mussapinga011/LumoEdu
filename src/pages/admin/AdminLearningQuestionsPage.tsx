import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionsBySession, savePracticeQuestion, deletePracticeQuestion } from '../../services/practiceService';
import { PracticeQuestion } from '../../types/practice';
import { Plus, Edit, Trash2, ArrowLeft, HelpCircle, Save, X, CheckSquare, List, Upload, Eye } from 'lucide-react';
import clsx from 'clsx';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import RichTextRenderer from '../../components/RichTextRenderer';

const AdminLearningQuestionsPage = () => {
  const { disciplineId, sessionId } = useParams<{ disciplineId: string, sessionId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<Partial<PracticeQuestion>[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Partial<PracticeQuestion> | null>(null);

  const { modalState, showConfirm, closeModal } = useModal();
  const { toastState, showSuccess, showError, closeToast } = useToast();

  useEffect(() => {
    if (disciplineId && sessionId) fetchQuestions();
  }, [disciplineId, sessionId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestionsBySession(disciplineId!, sessionId!);
      setQuestions(data);
    } catch (error) {
      showError('Erro ao carregar questões');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplineId || !sessionId || !editingQuestion?.question) return;

    try {
      await savePracticeQuestion(disciplineId, sessionId, {
        ...editingQuestion,
        sessionId,
        xp: editingQuestion.xp || 10,
        type: editingQuestion.type || 'multiple_choice'
      });
      showSuccess('Questão salva!');
      setIsModalOpen(false);
      fetchQuestions();
    } catch (error) {
      showError('Erro ao salvar');
    }
  };

  const handleDelete = (questionId: string) => {
    showConfirm('Excluir Questão', 'Tem certeza?', async () => {
      try {
        await deletePracticeQuestion(disciplineId!, sessionId!, questionId);
        showSuccess('Excluída!');
        fetchQuestions();
      } catch (error) {
        showError('Erro ao excluir');
      }
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(editingQuestion?.options || ['', '', '', ''])];
    newOptions[index] = value;
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const handleBulkImport = () => {
    try {
      // Automatic backslash fix for LaTeX: convert single \ to double \\ 
      // but only if it's not already escaped
      const sanitizedJson = bulkJson.replace(/(?<!\\)\\(?!["\\\/bfnrtu])/g, '\\\\');
      const parsed = JSON.parse(sanitizedJson);
      
      if (!Array.isArray(parsed)) {
        showError('JSON deve ser um array de questões');
        return;
      }

      // Validate each question
      const validQuestions = parsed.filter((q: any) => {
        return q.question && 
               Array.isArray(q.options) && 
               q.options.length >= 2 && 
               q.options.length <= 5 && 
               q.answer && 
               q.options.includes(q.answer);
      });

      if (validQuestions.length === 0) {
        showError('Nenhuma questão válida encontrada no JSON');
        return;
      }

      if (validQuestions.length < parsed.length) {
        showError(`${parsed.length - validQuestions.length} questões inválidas foram ignoradas`);
      }

      setPreviewQuestions(validQuestions);
      setIsBulkImportOpen(false);
      setIsPreviewOpen(true);
    } catch (error) {
      showError('JSON inválido. Verifique a sintaxe.');
    }
  };

  const handleConfirmImport = async () => {
    if (!disciplineId || !sessionId) return;

    try {
      await Promise.all(
        previewQuestions.map(q => 
          savePracticeQuestion(disciplineId, sessionId, {
            ...q,
            sessionId,
            xp: q.xp || 10,
            type: 'multiple_choice'
          })
        )
      );
      
      showSuccess(`${previewQuestions.length} questões importadas com sucesso!`);
      setIsPreviewOpen(false);
      setPreviewQuestions([]);
      setBulkJson('');
      fetchQuestions();
    } catch (error) {
      showError('Erro ao importar questões');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest">Carregando Questões...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Banco de Questões</h1>
          <p className="text-gray-500 font-medium text-sm text-primary font-bold uppercase tracking-widest">Módulo Gamificado</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <HelpCircle size={20} className="text-primary" />
            Conteúdo da Sessão ({questions.length} questões)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center gap-2 text-sm"
            >
              <Upload size={16} />
              Importar JSON
            </button>
            <button
              onClick={() => {
                setEditingQuestion({ 
                  question: '', 
                  options: ['', '', '', '', ''], 
                  answer: '', 
                  explanation: '', 
                  xp: 10, 
                  type: 'multiple_choice' 
                });
                setIsModalOpen(true);
              }}
              className="px-6 py-2 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              Adicionar Questão
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {questions.length === 0 ? (
              <div className="py-20 text-center text-gray-400">Clique no botão acima para criar a primeira questão desta jornada.</div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-start justify-between gap-4 group">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                       <span className="bg-white border text-gray-400 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs">#{idx+1}</span>
                       <span className="text-xs font-black text-primary uppercase tracking-tighter">Questão Interativa</span>
                    </div>
                    <div className="font-bold text-gray-800 text-lg">
                      <RichTextRenderer content={q.question} />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {q.options.map((opt, i) => (
                        <div key={i} className={clsx(
                          "px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2",
                          opt === q.answer ? "bg-green-100 text-green-700 border border-green-200" : "bg-white text-gray-400 border border-gray-100"
                        )}>
                          <span>{String.fromCharCode(65 + i)})</span>
                          <RichTextRenderer content={opt} />
                          {opt === q.answer && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setEditingQuestion(q); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-blue-100">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="p-2 text-red-500 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-red-100">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                {editingQuestion?.id ? 'Editar Questão' : 'Nova Questão'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                     <HelpCircle size={14} className="text-primary" /> Pergunta
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={editingQuestion?.question}
                    onChange={e => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                    placeholder="Dica: Use $...$ para LaTeX inline ou $$...$$ para blocos."
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                    Visualização LaTeX
                  </label>
                  <div className="w-full px-5 py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl min-h-[100px] flex items-center justify-center text-center overflow-auto">
                    {editingQuestion?.question ? (
                      <RichTextRenderer content={editingQuestion.question} className="text-gray-800" />
                    ) : (
                      <span className="text-gray-400 text-xs italic">A prévia da questão aparecerá aqui...</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest">
                     <List size={14} className="text-primary" /> Opções de Resposta
                  </label>
                  <button 
                    type="button"
                    onClick={() => {
                      const opts = editingQuestion?.options || [];
                      if (opts.length < 5) {
                        setEditingQuestion({ ...editingQuestion, options: [...opts, ''] });
                      }
                    }}
                    disabled={(editingQuestion?.options?.length || 0) >= 5}
                    className="text-[10px] font-black uppercase text-primary hover:underline disabled:opacity-50"
                  >
                    + Adicionar Opção
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {editingQuestion?.options?.map((opt, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Opção {String.fromCharCode(65 + i)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-300 group-focus-within:text-primary transition-colors">
                            {String.fromCharCode(65 + i)}
                          </div>
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={e => handleOptionChange(i, e.target.value)}
                            className="w-full pl-10 pr-10 py-3 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-all font-bold text-gray-700"
                            placeholder="Opção..."
                          />
                          {editingQuestion.options!.length > 2 && (
                            <button 
                              type="button"
                              onClick={() => {
                                const newOpts = editingQuestion.options!.filter((_, idx) => idx !== i);
                                setEditingQuestion({ ...editingQuestion, options: newOpts });
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        <div className="px-4 py-2 bg-gray-50 border-2 border-dashed border-gray-100 rounded-xl flex items-center min-h-[48px]">
                          {opt ? (
                            <RichTextRenderer content={opt} className="text-sm text-gray-600" />
                          ) : (
                            <span className="text-[10px] text-gray-300 italic">Preview...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                      <CheckSquare size={14} className="text-green-500" /> Resposta Correta
                   </label>
                   <select
                    required
                    value={editingQuestion?.answer}
                    onChange={e => setEditingQuestion({ ...editingQuestion, answer: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-primary outline-none bg-gray-50 font-black text-gray-700"
                   >
                     <option value="">Selecione a correta</option>
                     {editingQuestion?.options?.filter(o => o.trim() !== '').map((opt, i) => (
                       <option key={i} value={opt}>{opt}</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                      Recompensa (XP)
                   </label>
                   <input
                    type="number"
                    value={editingQuestion?.xp}
                    onChange={e => setEditingQuestion({ ...editingQuestion, xp: parseInt(e.target.value) })}
                    className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-primary outline-none bg-gray-50 font-black text-primary"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                     Explicação (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={editingQuestion?.explanation}
                    onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-primary outline-none font-medium"
                    placeholder="Por que esta é a resposta correta?"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                    Visualização Explicação
                  </label>
                  <div className="w-full px-5 py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl min-h-[80px] flex items-center justify-center text-center overflow-auto">
                    {editingQuestion?.explanation ? (
                      <RichTextRenderer content={editingQuestion.explanation} className="text-sm text-gray-800" />
                    ) : (
                      <span className="text-gray-400 text-[10px] italic">A prévia da explicação aparecerá aqui...</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl active:scale-95 transition-all uppercase tracking-widest text-xs">Cancelar</button>
                <button type="submit" className="flex-[2] px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                  <Save size={20} /> Salvar Questão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importação em Massa */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Importar Questões (JSON)</h3>
                <p className="text-sm text-gray-500 mt-1">Cole o JSON com as questões abaixo</p>
              </div>
              <button onClick={() => {setIsBulkImportOpen(false); setBulkJson('');}} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <HelpCircle size={16} />
                  Formato Esperado
                </h4>
                <pre className="text-xs bg-white p-3 rounded-lg overflow-x-auto text-gray-700 font-mono">
{`[
  {
    "question": "Qual é a capital de Moçambique?",
    "options": ["Maputo", "Beira", "Nampula", "Tete"],
    "answer": "Maputo",
    "explanation": "Maputo é a capital.",
    "xp": 10
  }
]`}
                </pre>
              </div>

              <textarea
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none font-mono text-sm"
                placeholder="Cole o JSON aqui..."
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => {setIsBulkImportOpen(false); setBulkJson('');}} 
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleBulkImport}
                  className="flex-[2] px-6 py-3 bg-blue-500 text-white font-black rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  <Eye size={20} />
                  Visualizar Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preview */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Preview de Importação</h3>
                <p className="text-sm text-gray-500 mt-1">{previewQuestions.length} questões prontas para importar</p>
              </div>
              <button onClick={() => {setIsPreviewOpen(false); setPreviewQuestions([]);}} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {previewQuestions.map((q, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-gray-800">{q.question}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-8">
                    {q.options?.map((opt, i) => (
                      <span 
                        key={i} 
                        className={clsx(
                          "px-3 py-1 rounded-lg text-xs font-bold",
                          opt === q.answer 
                            ? "bg-green-100 text-green-700 border border-green-300" 
                            : "bg-white text-gray-500 border border-gray-200"
                        )}
                      >
                        {opt === q.answer && '✓ '}{opt}
                      </span>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-gray-500 mt-2 ml-8 italic">💡 {q.explanation}</p>
                  )}
                  <p className="text-xs text-primary font-bold mt-2 ml-8">+{q.xp || 10} XP</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t">
              <button 
                onClick={() => {setIsPreviewOpen(false); setPreviewQuestions([]);}} 
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmImport}
                className="flex-[2] px-6 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Confirmar Importação ({previewQuestions.length} questões)
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal {...modalState} onClose={closeModal} />
      {toastState.isOpen && <Toast {...toastState} onClose={closeToast} />}
    </div>
  );
};

export default AdminLearningQuestionsPage;
