import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLearningQuestionsBySession, saveLearningQuestion, deleteLearningQuestion } from '../../services/contentService.supabase';
import { Plus, Edit2, Trash2, ArrowLeft, X, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

const AdminLearningQuestionsPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  useEffect(() => {
    if (sessionId) fetchQuestions();
  }, [sessionId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await getLearningQuestionsBySession(sessionId!);
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const question = {
      id: editingQuestion?.id || crypto.randomUUID(),
      sessionId,
      statement: formData.get('statement'),
      options: [
        formData.get('opt0'),
        formData.get('opt1'),
        formData.get('opt2'),
        formData.get('opt3'),
      ],
      correctOption: parseInt(formData.get('correctOption') as string),
      explanation: formData.get('explanation'),
      orderIndex: editingQuestion?.order_index || questions.length,
    };

    await saveLearningQuestion(question);
    setIsModalOpen(false);
    fetchQuestions();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar esta questão prática?')) {
      await deleteLearningQuestion(id);
      fetchQuestions();
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-primary">PREPARANDO DESAFIOS...</div>;

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-primary hover:text-white transition-all"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase leading-none">Questões de Fixação</h1>
            <p className="text-gray-400 font-medium mt-1">Sessão ID: {sessionId?.slice(0, 8)}...</p>
          </div>
        </div>
        <button onClick={() => { setEditingQuestion(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:translate-y-1">
          <Plus size={20} /> ADICIONAR QUESTÃO
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="group bg-white p-8 rounded-[40px] border-2 border-transparent hover:border-primary transition-all shadow-sm hover:shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-primary/10 text-primary px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">Questão {idx + 1}</span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingQuestion(uTranslate(q)); setIsModalOpen(true); }} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(q.id)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
            
            <p className="text-gray-800 font-bold text-lg mb-6 leading-relaxed line-clamp-3">{q.statement}</p>
            
            <div className="space-y-2 mb-6">
              {q.options.map((opt: string, i: number) => (
                <div key={i} className={clsx("p-4 rounded-2xl border-2 font-medium flex items-center justify-between", i === q.correct_option ? "bg-green-50 border-green-200 text-green-700 font-black" : "border-gray-50 text-gray-400")}>
                  <div className="text-sm">{opt}</div>
                  {i === q.correct_option && <CheckCircle2 size={18} />}
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3">
              <div className="text-blue-500 shrink-0"><CheckCircle2 size={20} /></div>
              <div className="text-xs text-blue-600 font-bold italic leading-relaxed">{q.explanation || 'Nenhuma explicação cadastrada.'}</div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-2xl shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">{editingQuestion ? 'Ajustar Questão' : 'Novo Desafio'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400"><X size={32} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Enunciado da Questão</label>
                <textarea name="statement" required defaultValue={editingQuestion?.statement} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-bold h-32 leading-relaxed" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i}>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Opção {['A', 'B', 'C', 'D'][i]}</label>
                    <input name={`opt${i}`} required defaultValue={editingQuestion?.options?.[i]} className="w-full p-3 bg-gray-100 rounded-xl border-2 border-transparent focus:border-primary outline-none font-bold" />
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Opção Correta</label>
                  <select name="correctOption" defaultValue={editingQuestion?.correctOption ?? 0} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary font-black outline-none">
                    <option value="0">Opção A</option>
                    <option value="1">Opção B</option>
                    <option value="2">Opção C</option>
                    <option value="3">Opção D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Explicação / Porquê desta resposta</label>
                <textarea name="explanation" required defaultValue={editingQuestion?.explanation} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-bold h-24" placeholder="Ajude o aluno a entender o erro..." />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-black text-gray-400 uppercase">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white py-5 rounded-3xl font-black shadow-lg shadow-primary/20 active:translate-y-1">SALVAR 🎯</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to translate snake_case from DB to camelCase for form if needed
const uTranslate = (q: any) => {
  if (!q) return null;
  return {
    ...q,
    correctOption: q.correct_option
  };
};

export default AdminLearningQuestionsPage;
