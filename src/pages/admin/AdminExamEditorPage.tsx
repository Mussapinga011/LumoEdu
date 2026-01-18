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
} from '../../services/examService.supabase';
import { Question } from '../../types/exam';
import { useContentStore } from '../../stores/useContentStore';
import { 
  ArrowLeft, Trash2, Check, Edit, 
  GripVertical, ChevronUp, ChevronDown, 
  Save, HelpCircle, ExternalLink,
  CheckCircle2
} from 'lucide-react';
import clsx from 'clsx';
import RichTextRenderer from '../../components/RichTextRenderer';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';

const AdminExamEditorPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { disciplines, universities, fetchContent } = useContentStore();

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);
  
  const isEditing = !!examId;
  const { modalState, showConfirm, closeModal } = useModal();
  const { toastState, showSuccess, showError, showWarning, closeToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState<any>({
    name: '',
    disciplineId: '',
    universityId: '',
    year: new Date().getFullYear(),
    season: '1ª época',
    isActive: true 
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  const [questionForm, setQuestionForm] = useState<Partial<Question>>({
    statement: '',
    options: ['', '', '', '', ''],
    correctOption: '',
    explanation: ''
  });

  // Auto-resize textareas when content changes
  // Auto-resize textareas when content changes (only for elements with auto-expand class)
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea.auto-expand');
    textareas.forEach(textarea => {
      const el = textarea as HTMLTextAreaElement;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    });
  }, [questionForm]);

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
        setExamData({
          id: exam.id,
          name: exam.title,
          disciplineId: exam.discipline_id,
          universityId: exam.university_id,
          year: exam.year,
          season: exam.season || '1ª época',
          isActive: exam.is_active
        });

        const q = await getQuestionsByExam(id);
        const mappedQuestions: Question[] = (q as any[]).map(item => ({
          id: item.id,
          examId: item.exam_id,
          statement: item.question_text,
          options: item.options,
          correctOption: item.options[item.correct_answer],
          explanation: item.explanation,
          difficulty: item.difficulty,
          order: item.order_index
        }));

        const sortedQuestions = mappedQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));
        setQuestions(sortedQuestions);
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExam = async () => {
    if (!examData.name || !examData.disciplineId || !examData.universityId) {
      showWarning('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: examData.name,
        discipline_id: examData.disciplineId,
        university_id: examData.universityId,
        year: examData.year,
        is_active: examData.isActive
        // Removido season e questions_count conforme correções anteriores de banco
      };

      if (isEditing && examId) {
        await updateExam(examId, payload);
        showSuccess('Exame atualizado com sucesso!');
      } else {
        const data = await createExam(payload);
        showSuccess('Exame criado com sucesso!');
        navigate(`/admin/exams/${data.id}/edit`);
      }
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    const options = questionForm.options || [];
    const validOptions = options.filter(o => o && o.trim() !== '');
    
    if (!questionForm.statement || !questionForm.correctOption || validOptions.length < 2) {
      showWarning('Preencha o enunciado, a resposta correta e pelo menos 2 alternativas.');
      return;
    }

    if (!examId) return;

    const correctIndex = validOptions.indexOf(questionForm.correctOption);
    const orderIndex = questionForm.order ?? questions.length;

    const questionPayload = {
      exam_id: examId,
      question_text: questionForm.statement,
      options: validOptions,
      correct_answer: correctIndex,
      explanation: questionForm.explanation,
      order_index: orderIndex,
      question_number: orderIndex + 1
    };

    try {
      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, questionPayload);
        showSuccess('Questão atualizada!');
      } else {
        await createQuestion(questionPayload);
        showSuccess('Questão adicionada!');
      }
      
      setQuestionForm({
        statement: '',
        options: ['', '', '', '', ''],
        correctOption: '',
        explanation: ''
      });
      setEditingQuestionId(null);
      fetchExamData(examId);
      
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    const paddedOptions = [...question.options];
    while (paddedOptions.length < 5) paddedOptions.push('');
    setQuestionForm({ ...question, options: paddedOptions });
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleDeleteQuestion = async (id: string) => {
    showConfirm('Excluir Questão', 'Deseja realmente excluir esta questão?', async () => {
      try {
        await deleteQuestion(id);
        showSuccess('Questão excluída!');
        fetchExamData(examId!);
      } catch (error) {
        showError(getErrorMessage(error));
      }
    });
  };

  const handleMoveQuestion = async (id: string, currentOrder: number, direction: 'up' | 'down') => {
    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    if (targetOrder < 0 || targetOrder >= questions.length) return;

    const targetQuestion = questions.find(q => q.order === targetOrder);
    const currentQuestion = questions.find(q => q.id === id);

    if (currentQuestion && targetQuestion) {
      try {
        await updateQuestion(currentQuestion.id, { order_index: targetOrder, question_number: targetOrder + 1 });
        await updateQuestion(targetQuestion.id, { order_index: currentOrder, question_number: currentOrder + 1 });
        fetchExamData(examId!);
      } catch (error) {
        showError('Erro ao reordenar');
      }
    }
  };

  const filteredDisciplines = disciplines.filter(d => d.universityId === examData.universityId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 px-4">
      {/* HEADER DINÂMICO */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/exams')} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={28} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          {isEditing ? 'Editar Exame' : 'Novo Exame'}
        </h1>
      </div>

      {/* CARD: DETALHES DO EXAME */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
          <h2 className="text-xl font-bold text-gray-700">Detalhes do Exame</h2>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 ml-1">Nome do Exame</label>
              <input
                type="text"
                value={examData.name}
                onChange={e => setExamData({ ...examData, name: e.target.value })}
                className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-700"
                placeholder="Ex: Exame de Física I"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 ml-1">Universidade</label>
              <select
                value={examData.universityId}
                onChange={e => setExamData({ ...examData, universityId: e.target.value, disciplineId: '' })}
                className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat"
              >
                <option value="">Selecionar Universidade</option>
                {universities.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 ml-1">Disciplina</label>
              <select
                value={examData.disciplineId}
                onChange={e => setExamData({ ...examData, disciplineId: e.target.value })}
                className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={!examData.universityId}
              >
                <option value="">Selecionar Disciplina</option>
                {filteredDisciplines.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 ml-1">Ano</label>
              <input
                type="number"
                value={examData.year}
                onChange={e => setExamData({ ...examData, year: parseInt(e.target.value) })}
                className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-700 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 ml-1">Época</label>
              <select
                value={examData.season}
                onChange={e => setExamData({ ...examData, season: e.target.value })}
                className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat"
              >
                <option value="1ª época">1ª época</option>
                <option value="2ª época">2ª época</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 ml-1">Status do Exame</label>
              <div className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                <button
                  onClick={() => setExamData({ ...examData, isActive: !examData.isActive })}
                  className={clsx(
                    "w-14 h-8 rounded-full relative transition-all duration-300",
                    examData.isActive ? "bg-green-500" : "bg-gray-300"
                  )}
                >
                  <div className={clsx(
                    "absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm",
                    examData.isActive ? "left-7" : "left-1"
                  )} />
                </button>
                <div>
                  <p className={clsx("text-sm font-bold", examData.isActive ? "text-green-600" : "text-gray-500")}>
                    {examData.isActive ? "✓ Ativo (Visível para usuários)" : "✕ Inativo"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium leading-none">Os usuários podem ver e fazer este exame</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSaveExam}
              className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-sm uppercase tracking-wider"
            >
              <Save size={20} />
              {isEditing ? 'Atualizar Detalhes' : 'Criar Exame'}
            </button>
          </div>
        </div>
      </section>

      {/* HEADER DAS QUESTÕES */}
      <div className="pt-8 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Questões ({questions.length})</h2>
      </div>

      {isEditing && (
        <div className="space-y-12">
          {/* FORMULÁRIO DE NOVA QUESTÃO (COM BORDA PONTILHADA) */}
          <section className="bg-white p-10 rounded-3xl border-2 border-dashed border-gray-200 space-y-8">
            <h3 className="text-lg font-bold text-gray-700">
              {editingQuestionId ? 'Editar Questão' : 'Adicionar Nova Questão'}
            </h3>

            {/* ENUNCIADO */}
            <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-bold text-gray-600">Enunciado</label>
                    <button className="flex items-center gap-1.5 text-blue-500 text-[11px] font-bold hover:underline">
                        <HelpCircle size={14} /> Ajuda de Sintaxe
                    </button>
                </div>
                <textarea
                    value={questionForm.statement}
                    onChange={e => setQuestionForm({ ...questionForm, statement: e.target.value })}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                    className="w-full p-6 border border-gray-200 rounded-2xl min-h-44 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-gray-50/30 resize-none overflow-hidden auto-expand"
                    placeholder="Digite o enunciado da questão..."
                />
                
                {/* PREVIEW ENUNCIADO */}
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest border-b pb-1 mb-2">Pré-visualização:</p>
                    <div className="text-gray-700 font-medium overflow-x-auto min-h-[1.5rem]">
                        {questionForm.statement ? <RichTextRenderer content={questionForm.statement} /> : <span className="opacity-0">...</span>}
                    </div>
                </div>
            </div>

            {/* GRID DE OPÇÕES (A, B, C, D, E) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {questionForm.options?.map((opt, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-bold text-gray-600">
                        Opção {String.fromCharCode(65 + idx)} {idx === 4 && <span className="text-gray-300 font-medium">(Opcional)</span>}
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <textarea
                      value={opt}
                      onChange={e => {
                        const newOpts = [...(questionForm.options || [])];
                        newOpts[idx] = e.target.value;
                        setQuestionForm({ ...questionForm, options: newOpts });
                      }}
                      rows={2}
                      className="flex-1 px-5 py-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-mono text-gray-700 bg-gray-50/30 text-sm resize-y overflow-y-auto"
                      placeholder={`Opção ${String.fromCharCode(65 + idx)} (suporta LaTeX/Img)`}
                    />
                    <button
                      onClick={() => setQuestionForm({ ...questionForm, correctOption: opt })}
                      className={clsx(
                        "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 shadow-sm",
                        questionForm.correctOption === opt && opt !== '' 
                            ? "bg-green-500 border-green-500 text-white" 
                            : "bg-white border-gray-100 text-gray-300 hover:border-green-200 hover:text-green-500"
                      )}
                    >
                      <Check size={28} strokeWidth={3} />
                    </button>
                  </div>
                  
                  {/* PREVIEW DA OPÇÃO */}
                  <div className="px-5 py-3 bg-white border border-gray-100 rounded-xl">
                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-1">Preview</p>
                    <div className="text-xs text-gray-500 overflow-x-auto font-medium">
                        {opt ? <RichTextRenderer content={opt} /> : <span className="opacity-30">...</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* EXPLICAÇÃO */}
            <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-bold text-gray-600">Explicação (Opcional)</label>
                    <button className="flex items-center gap-1.5 text-blue-500 text-[11px] font-bold hover:underline">
                        <HelpCircle size={14} /> Ajuda de Sintaxe
                    </button>
                </div>
                <textarea
                    value={questionForm.explanation}
                    onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                    className="w-full p-6 border border-gray-200 rounded-2xl min-h-32 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all bg-gray-50/30 resize-none overflow-hidden auto-expand"
                    placeholder="Digite a explicação da questão..."
                />
                
                {/* PREVIEW EXPLICAÇÃO */}
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest border-b pb-1 mb-2">Pré-visualização da Explicação:</p>
                    <div className="text-gray-700 font-medium overflow-x-auto min-h-[1.5rem]">
                        {questionForm.explanation ? <RichTextRenderer content={questionForm.explanation} /> : <span className="opacity-0">...</span>}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSaveQuestion} 
                className="bg-green-500 text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-green-100 hover:bg-green-600 active:scale-95 transition-all text-sm uppercase tracking-wider"
              >
                {editingQuestionId ? 'Atualizar Questão' : 'Adicionar Questão'}
              </button>
            </div>
          </section>

          {/* LISTA DE QUESTÕES (CARDS) */}
          <div className="space-y-8">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8 relative group transition-all hover:border-blue-100">
                
                {/* CABEÇALHO DO CARD */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <GripVertical size={20} className="text-gray-300 shrink-0 cursor-move" />
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-gray-400 text-sm">
                            #{idx + 1}
                        </div>
                        <div className="text-gray-700 font-bold leading-relaxed max-w-2xl overflow-x-auto whitespace-pre-wrap break-words">
                            <span className="mr-2 text-gray-400 font-medium">{idx + 1}.</span>
                            {q.statement}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleEditQuestion(q)} 
                            className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                        >
                            <Edit size={18} />
                        </button>
                        <button 
                            onClick={() => handleDeleteQuestion(q.id)} 
                            className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {/* ALTERNATIVAS RENDERIZADAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pl-14">
                    {q.options.map((opt, i) => {
                        const isCorrect = q.correctOption === opt;
                        return (
                            <div key={i} className={clsx(
                                "flex items-center gap-3 text-sm font-medium",
                                isCorrect ? "text-green-600" : "text-gray-500"
                            )}>
                                <span className="font-bold shrink-0">{String.fromCharCode(65 + i)}.</span>
                                <div className="overflow-x-auto selection:bg-green-100 whitespace-pre-wrap break-words">
                                    {opt}
                                </div>
                                {isCorrect && <CheckCircle2 size={16} strokeWidth={3} className="shrink-0" />}
                            </div>
                        );
                    })}
                </div>

                {/* RODAPÉ DO CARD: ORDENAÇÃO */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-50 pl-14">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mr-2">Ordenar:</span>
                        <button 
                            onClick={() => handleMoveQuestion(q.id, q.order || 0, 'up')}
                            disabled={idx === 0}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronUp size={20} className="text-gray-500" />
                        </button>
                        <button 
                            onClick={() => handleMoveQuestion(q.id, q.order || 0, 'down')}
                            disabled={idx === questions.length - 1}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronDown size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Ir para posição:</span>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={idx + 1}
                                    onChange={() => {}} // Lógica de go-to position pode ser complexa, mas seguindo o visual
                                    className="w-16 px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-center font-bold text-gray-700 font-mono text-sm"
                                />
                            </div>
                            <span className="text-[11px] font-medium text-gray-400">de {questions.length}</span>
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPONENTES GLOBAIS */}
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
        <Toast message={toastState.message} type={toastState.type} onClose={closeToast} />
      )}
    </div>
  );
};

export default AdminExamEditorPage;
