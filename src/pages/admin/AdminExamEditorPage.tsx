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
import { ArrowLeft, Trash2, Check, Edit } from 'lucide-react';
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
          season: exam.season,
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
        season: examData.season,
        questions_count: questions.length,
        is_active: examData.isActive
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
      console.error("Error saving exam:", error);
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

    const questionPayload = {
      exam_id: examId,
      question_text: questionForm.statement,
      options: validOptions,
      correct_answer: correctIndex,
      explanation: questionForm.explanation,
      order_index: questionForm.order ?? questions.length,
      discipline_id: examData.disciplineId
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
      console.error("Error saving question:", error);
      showError(getErrorMessage(error));
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    const paddedOptions = [...question.options];
    while (paddedOptions.length < 5) paddedOptions.push('');
    setQuestionForm({ ...question, options: paddedOptions });
  };

  const handleDeleteQuestion = async (id: string) => {
    showConfirm(
      'Excluir Questão',
      'Tem certeza?',
      async () => {
        try {
          await deleteQuestion(id);
          showSuccess('Questão excluída!');
          fetchExamData(examId!);
        } catch (error) {
          showError(getErrorMessage(error));
        }
      }
    );
  };

  const filteredDisciplines = disciplines.filter(d => d.universityId === examData.universityId);

  if (loading && !examData.id) return <div className="p-20 text-center font-bold text-gray-400">Carregando Exame...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/exams')} className="text-gray-500 hover:text-gray-700 p-2 bg-gray-100 rounded-lg">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-tighter">
          {isEditing ? 'Editar Exame' : 'Criar Novo Exame'}
        </h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-lg font-black text-gray-700 border-b pb-2 uppercase tracking-widest text-[10px]">Detalhes do Exame</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nome do Exame</label>
            <input
              type="text"
              value={examData.name}
              onChange={e => setExamData({ ...examData, name: e.target.value })}
              className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-primary outline-none font-bold"
              placeholder="Ex: Exame de Química 2023"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Universidade</label>
            <select
              value={examData.universityId}
              onChange={e => setExamData({ ...examData, universityId: e.target.value, disciplineId: '' })}
              className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-primary outline-none font-bold"
            >
              <option value="">Selecionar Universidade</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>{u.shortName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Disciplina</label>
            <select
              value={examData.disciplineId}
              onChange={e => setExamData({ ...examData, disciplineId: e.target.value })}
              className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-primary outline-none font-bold"
              disabled={!examData.universityId}
            >
              <option value="">Selecionar Disciplina</option>
              {filteredDisciplines.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ano</label>
            <input
              type="number"
              value={examData.year}
              onChange={e => setExamData({ ...examData, year: parseInt(e.target.value) })}
              className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-primary outline-none font-bold"
            />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button onClick={handleSaveExam} className="bg-primary text-white px-10 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 active:translate-y-1">
            SALVAR EXAME
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
            <h3 className="font-black text-gray-800 mb-4 uppercase tracking-widest text-[10px]">{editingQuestionId ? 'Editar Questão' : 'Nova Questão'}</h3>
            <textarea
              value={questionForm.statement}
              onChange={e => setQuestionForm({ ...questionForm, statement: e.target.value })}
              className="w-full p-4 border-2 border-white rounded-2xl h-32 mb-4 font-mono text-sm focus:border-primary outline-none bg-white"
              placeholder="Enunciado da questão..."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {questionForm.options?.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={e => {
                      const newOpts = [...(questionForm.options || [])];
                      newOpts[idx] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOpts });
                    }}
                    className={clsx(
                      "flex-1 p-3 border-2 rounded-xl outline-none font-bold transition-all",
                      questionForm.correctOption === opt && opt !== '' ? "border-green-500 bg-green-50 text-green-700" : "border-white bg-white focus:border-primary"
                    )}
                    placeholder={`Opção ${String.fromCharCode(65 + idx)}`}
                  />
                  <button
                    onClick={() => setQuestionForm({ ...questionForm, correctOption: opt })}
                    className={clsx(
                      "p-3 rounded-xl border-2 transition-all",
                      questionForm.correctOption === opt && opt !== '' ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200" : "bg-white border-white text-gray-300 hover:text-primary"
                    )}
                  >
                    <Check size={20} />
                  </button>
                </div>
              ))}
            </div>

            <textarea
              value={questionForm.explanation}
              onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
              className="w-full p-4 border-2 border-white rounded-2xl h-24 mb-4 focus:border-primary outline-none bg-white font-medium"
              placeholder="Explicação da resposta (opcional)"
            />

            <div className="flex justify-end gap-3 pt-2">
              {editingQuestionId && (
                 <button onClick={() => setEditingQuestionId(null)} className="px-6 py-3 font-black text-gray-400 tracking-tighter uppercase">Cancelar</button>
              )}
              <button 
                onClick={handleSaveQuestion} 
                className="bg-secondary text-white px-10 py-3 rounded-2xl font-black shadow-lg shadow-secondary/20 active:translate-y-1"
              >
                {editingQuestionId ? 'ATUALIZAR' : 'ADICIONAR QUESTÃO'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest pl-2">Questões do Exame ({questions.length})</h3>
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between group hover:shadow-md transition-all">
                <div className="flex-1">
                  <span className="font-black text-primary/30 mr-2 text-sm uppercase">#{idx + 1}</span>
                  <div className="inline-block align-top max-w-[90%]">
                    <RichTextRenderer content={q.statement} />
                  </div>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleEditQuestion(q)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
