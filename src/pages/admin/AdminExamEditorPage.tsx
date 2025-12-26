import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  createExam, 
  getExam, 
  updateExam, 
  createQuestion, 
  getQuestionsByExam, 
  updateQuestion, 
  deleteQuestion 
} from '../../services/dbService';
import { Exam, Question } from '../../types/exam';
import { useContentStore } from '../../stores/useContentStore';
import { ArrowLeft, Save, Trash2, Check, X, Edit, Eye, HelpCircle, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import clsx from 'clsx';
import RichTextRenderer from '../../components/RichTextRenderer';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';

const AdminExamEditorPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { disciplines, fetchDisciplines } = useContentStore();

  useEffect(() => {
    fetchDisciplines();
  }, [fetchDisciplines]);
  const isEditing = !!examId;
  const { modalState, showConfirm, closeModal } = useModal();
  const { toastState, showSuccess, showError, showWarning, closeToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState<Partial<Exam>>({
    name: '',
    disciplineId: '',
    year: new Date().getFullYear(),
    season: '1ª época',
    questionsCount: 0,
    description: '',
    isActive: true // Exames são ativos por padrão
  });

  const [selectedUniversity, setSelectedUniversity] = useState<'UEM' | 'UP'>('UEM');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showExplanationPreview, setShowExplanationPreview] = useState(true);
  const [showExplanationHelp, setShowExplanationHelp] = useState(false);
  const [questionForm, setQuestionForm] = useState<Partial<Question>>({
    statement: '',
    options: ['', '', '', '', ''],
    correctOption: '',
    explanation: ''
  });

  useEffect(() => {
    if (isEditing && examId) {
      fetchExamData(examId);
    }
  }, [examId]);

  const fetchExamData = async (id: string) => {
    setLoading(true);
    try {
      const exam = await getExam(id);
      if (exam) {
        setExamData(exam);
        const q = await getQuestionsByExam(id);
        // Sort questions by order field, or by index if order is not set
        const sortedQuestions = q.sort((a, b) => {
          const orderA = a.order ?? q.indexOf(a);
          const orderB = b.order ?? q.indexOf(b);
          return orderA - orderB;
        });
        setQuestions(sortedQuestions);
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExam = async () => {
    if (!examData.name || !examData.disciplineId) {
      showWarning('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Obter a disciplina selecionada para derivar a universidade
    const selectedDisciplineObj = disciplines.find(d => d.id === examData.disciplineId);
    
    if (!selectedDisciplineObj) {
      showError('Disciplina não encontrada');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && examId) {
        await updateExam(examId, { 
          ...examData, 
          questionsCount: questions.length,
          university: selectedDisciplineObj.university // Derivado da disciplina
        });
        showSuccess('Exame atualizado com sucesso!');
      } else {
        const newExamData = {
          ...examData,
          university: selectedDisciplineObj.university // Derivado da disciplina
        };
        const newId = await createExam(newExamData as Omit<Exam, 'id'>);
        showSuccess('Exame criado com sucesso!');
        navigate(`/admin/exams/${newId}/edit`);
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    // Validate that at least the first 4 options (A-D) are filled
    const options = questionForm.options || [];
    const firstFourOptionsFilled = options.slice(0, 4).every(o => o && o.trim() !== '');
    
    if (!questionForm.statement || !questionForm.correctOption || !firstFourOptionsFilled) {
      showWarning('Por favor, preencha o enunciado, a resposta correta e pelo menos as 4 primeiras alternativas (A-D)');
      return;
    }

    if (!examId) return;

    // Filter out empty options for saving
    const cleanOptions = options.filter(o => o && o.trim() !== '');
    const questionPayload = {
      ...questionForm,
      options: cleanOptions
    };

    try {
      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, questionPayload);
        setQuestions(questions.map(q => q.id === editingQuestionId ? { ...q, ...questionPayload } as Question : q));
        setEditingQuestionId(null);
        showSuccess('Questão atualizada com sucesso!');
      } else {
        // Add order field for new questions (add to the end)
        const newQ = { ...questionPayload, examId, order: questions.length } as Omit<Question, 'id'>;
        const id = await createQuestion(newQ);
        setQuestions([...questions, { ...newQ, id }]);
        showSuccess('Questão adicionada com sucesso!');
      }
      
      // Reset form
      setQuestionForm({
        statement: '',
        options: ['', '', '', '', ''],
        correctOption: '',
        explanation: ''
      });
      
      // Update exam question count
      await updateExam(examId, { questionsCount: questions.length + (editingQuestionId ? 0 : 1) });
      
    } catch (error) {
      console.error("Error saving question:", error);
      showError(getErrorMessage(error));
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    // Pad options to ensure 5 inputs are available, even if only 4 are saved
    const paddedOptions = [...question.options];
    while (paddedOptions.length < 5) {
      paddedOptions.push('');
    }
    setQuestionForm({ ...question, options: paddedOptions });
  };

  const handleDeleteQuestion = async (id: string) => {
    showConfirm(
      'Excluir Questão',
      'Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita.',
      async () => {
        try {
          await deleteQuestion(id);
          setQuestions(questions.filter(q => q.id !== id));
          if (examId) {
            await updateExam(examId, { questionsCount: questions.length - 1 });
          }
          showSuccess('Questão excluída com sucesso!');
        } catch (error) {
          console.error("Error deleting question:", error);
          showError(getErrorMessage(error));
        }
      },
      'Excluir',
      'Cancelar'
    );
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(questionForm.options || [])];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const updateQuestionsOrder = async (updatedQuestions: Question[]) => {
    try {
      // Update order for all questions
      const updatePromises = updatedQuestions.map((q, index) => 
        updateQuestion(q.id, { order: index })
      );
      await Promise.all(updatePromises);
      setQuestions(updatedQuestions);
      showSuccess('Ordem das questões atualizada!');
    } catch (error) {
      console.error("Error updating questions order:", error);
      showError('Erro ao atualizar ordem das questões');
    }
  };

  const moveQuestion = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= questions.length) return;
    
    const newQuestions = [...questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);
    
    await updateQuestionsOrder(newQuestions);
  };

  const moveQuestionToPosition = async (questionId: string, newPosition: number) => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;
    
    // Convert to 0-based index (user inputs 1-based)
    const targetIndex = newPosition - 1;
    
    if (targetIndex < 0 || targetIndex >= questions.length) {
      showWarning(`Posição inválida. Escolha entre 1 e ${questions.length}`);
      return;
    }
    
    await moveQuestion(currentIndex, targetIndex);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/exams')} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          {isEditing ? 'Editar Exame' : 'Criar Novo Exame'}
        </h1>
      </div>

      {/* Exam Metadata Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-lg font-bold text-gray-700 border-b pb-2">Detalhes do Exame</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Exame</label>
            <input
              type="text"
              value={examData.name}
              onChange={e => setExamData({ ...examData, name: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g. Exame 2014 - 1ª Época"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Universidade</label>
            <select
              value={selectedUniversity}
              onChange={e => {
                setSelectedUniversity(e.target.value as 'UEM' | 'UP');
                setExamData({ ...examData, disciplineId: '' }); // Reset discipline when university changes
              }}
              className="w-full p-2 border rounded-lg"
            >
              <option value="UEM">UEM</option>
              <option value="UP">UP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
            <select
              value={examData.disciplineId}
              onChange={e => setExamData({ ...examData, disciplineId: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Selecionar Disciplina</option>
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
              value={examData.year}
              onChange={e => setExamData({ ...examData, year: parseInt(e.target.value) })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Época</label>
            <select
              value={examData.season}
              onChange={e => setExamData({ ...examData, season: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="1ª época">1ª época</option>
              <option value="2ª época">2ª época</option>
              <option value="Extraordinário">Extraordinário</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status do Exame</label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setExamData({ ...examData, isActive: !examData.isActive })}
                className={clsx(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  examData.isActive ? "bg-green-500" : "bg-gray-300"
                )}
              >
                <span
                  className={clsx(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    examData.isActive ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
              <div>
                <p className={clsx("text-sm font-bold", examData.isActive ? "text-green-700" : "text-gray-600")}>
                  {examData.isActive ? "✓ Ativo (Visível para usuários)" : "✗ Inativo (Oculto dos usuários)"}
                </p>
                <p className="text-xs text-gray-500">
                  {examData.isActive 
                    ? "Os usuários podem ver e fazer este exame" 
                    : "Apenas administradores podem ver este exame"}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveExam}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover"
          >
            <Save size={20} />
            {isEditing ? 'Atualizar Detalhes' : 'Criar Exame'}
          </button>
        </div>
      </div>

      {/* Questions Section - Only visible if editing */}
      {isEditing && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Questões ({questions.length})</h2>
          </div>

          {/* Question Form */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-xl border-2 border-dashed border-gray-300">
            <h3 className="font-bold text-gray-700 mb-4">{editingQuestionId ? 'Editar Questão' : 'Adicionar Nova Questão'}</h3>
            <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Enunciado</label>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <HelpCircle size={14} />
                  Ajuda de Sintaxe
                </button>
              </div>
              {showHelp && (
                <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
                  <p className="font-bold text-blue-900">Matemática LaTeX:</p>
                  <p><code className="bg-white px-1 rounded">$x^2 + 5$</code> → fórmula em linha</p>
                  <p><code className="bg-white px-1 rounded">$$\frac{'{a}'}{'{b}'}$$</code> → fórmula em bloco</p>
                  <p className="font-bold text-blue-900 mt-2">Imagens:</p>
                  <p><code className="bg-white px-1 rounded">![descrição](url-da-imagem)</code></p>
                </div>
              )}
              <textarea
                value={questionForm.statement}
                onChange={e => setQuestionForm({ ...questionForm, statement: e.target.value })}
                className="w-full p-2 border rounded-lg h-24 font-mono text-sm"
                placeholder="Digite o texto da questão... Suporta LaTeX: $inline$ ou $$block$$, Imagens: ![alt](url)"
              />
              {showPreview && questionForm.statement && (
                <div className="mt-2 p-3 bg-gray-50 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium">Pré-visualização:</p>
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <RichTextRenderer content={questionForm.statement} />
                </div>
              )}
              {!showPreview && questionForm.statement && (
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Eye size={14} />
                  Mostrar Pré-visualização
                </button>
              )}
            </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questionForm.options?.map((opt, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opção {String.fromCharCode(65 + idx)} {idx === 4 && <span className="text-gray-400 font-normal text-xs">(Opcional)</span>}
                    </label>
                    <div className="flex gap-2 items-start">
                      <textarea
                        value={opt}
                        onChange={e => handleOptionChange(idx, e.target.value)}
                        className={clsx(
                          "w-full p-2 border rounded-lg font-mono text-sm min-h-[42px] resize-y",
                          questionForm.correctOption === opt && opt !== '' ? "border-green-500 ring-1 ring-green-500 bg-green-50" : ""
                        )}
                        placeholder={`Opção ${String.fromCharCode(65 + idx)} (suporta LaTeX/Img)`}
                        rows={2}
                      />
                      <button
                        onClick={() => setQuestionForm({ ...questionForm, correctOption: opt })}
                        className={clsx(
                          "p-2 rounded-lg border h-[42px] flex items-center justify-center shrink-0",
                          questionForm.correctOption === opt && opt !== '' 
                            ? "bg-green-500 text-white border-green-500" 
                            : "bg-white text-gray-400 border-gray-300 hover:bg-gray-50"
                        )}
                        title="Marcar como Correta"
                        disabled={!opt}
                      >
                        <Check size={20} />
                      </button>
                    </div>
                    {/* Preview da Opção */}
                    {opt && (
                      <div className="mt-2 p-2 bg-gray-50 rounded border text-sm min-h-[30px] flex items-center">
                        <div className="w-full overflow-x-auto">
                          <RichTextRenderer content={opt} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Explicação (Opcional)</label>
                  <button
                    type="button"
                    onClick={() => setShowExplanationHelp(!showExplanationHelp)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <HelpCircle size={14} />
                    Ajuda de Sintaxe
                  </button>
                </div>
                {showExplanationHelp && (
                  <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
                    <p className="font-bold text-blue-900">Matemática LaTeX:</p>
                    <p><code className="bg-white px-1 rounded">$x^2 + 5$</code> → fórmula em linha</p>
                    <p><code className="bg-white px-1 rounded">$$\frac{'{a}'}{'{b}'}$$</code> → fórmula em bloco</p>
                    <p className="font-bold text-blue-900 mt-2">Imagens:</p>
                    <p><code className="bg-white px-1 rounded">![descrição](url-da-imagem)</code></p>
                  </div>
                )}
                <textarea
                  value={questionForm.explanation}
                  onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  className="w-full p-2 border rounded-lg h-24 font-mono text-sm"
                  placeholder="Explique por que a resposta está correta... Suporta LaTeX e Imagens"
                />
                
                {showExplanationPreview && questionForm.explanation && (
                  <div className="mt-2 p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 font-medium">Pré-visualização da Explicação:</p>
                      <button
                        type="button"
                        onClick={() => setShowExplanationPreview(false)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="text-sm text-gray-700">
                      <RichTextRenderer content={questionForm.explanation} />
                    </div>
                  </div>
                )}
                {!showExplanationPreview && questionForm.explanation && (
                  <button
                    type="button"
                    onClick={() => setShowExplanationPreview(true)}
                    className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Eye size={14} />
                    Mostrar Pré-visualização
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-2">
                {editingQuestionId && (
                  <button
                    onClick={() => {
                      setEditingQuestionId(null);
                      setQuestionForm({ statement: '', options: ['', '', '', '', ''], correctOption: '', explanation: '' });
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleSaveQuestion}
                  className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-secondary-hover"
                >
                  {editingQuestionId ? 'Atualizar Questão' : 'Adicionar Questão'}
                </button>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-gray-400" />
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 break-words">
                          <RichTextRenderer content={q.statement} />
                        </p>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                          {q.options.map((opt, i) => (
                            <div key={i} className={clsx("flex items-center gap-2", opt === q.correctOption && "text-green-600 font-bold")}>
                              <span className="w-4">{String.fromCharCode(65 + i)}.</span>
                              {opt}
                              {opt === q.correctOption && <Check size={14} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEditQuestion(q)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Editar questão"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Excluir questão"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Reorder Controls */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Ordenar:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveQuestion(idx, idx - 1)}
                        disabled={idx === 0}
                        className={clsx(
                          "p-1.5 rounded border",
                          idx === 0 
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed" 
                            : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                        )}
                        title="Mover para cima"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => moveQuestion(idx, idx + 1)}
                        disabled={idx === questions.length - 1}
                        className={clsx(
                          "p-1.5 rounded border",
                          idx === questions.length - 1
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed" 
                            : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                        )}
                        title="Mover para baixo"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 font-medium">Ir para posição:</label>
                    <input
                      type="number"
                      min="1"
                      max={questions.length}
                      defaultValue={idx + 1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = parseInt((e.target as HTMLInputElement).value);
                          moveQuestionToPosition(q.id, value);
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (value !== idx + 1) {
                          moveQuestionToPosition(q.id, value);
                        }
                      }}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-xs text-gray-400">de {questions.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
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

      {/* Toast */}
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

export default AdminExamEditorPage;
