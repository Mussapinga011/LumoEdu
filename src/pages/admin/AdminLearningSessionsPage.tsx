import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLearningSessionsByDiscipline, saveLearningSession, deleteLearningSession } from '../../services/contentService.supabase';
import { useContentStore } from '../../stores/useContentStore';
import { Plus, Edit2, Trash2, ArrowLeft, Layout, Target, X } from 'lucide-react';

const AdminLearningSessionsPage = () => {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const navigate = useNavigate();
  const { disciplines } = useContentStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any | null>(null);

  const discipline = disciplines.find(d => d.id === disciplineId);

  useEffect(() => {
    if (disciplineId) fetchSessions();
  }, [disciplineId]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await getLearningSessionsByDiscipline(disciplineId!);
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const session = {
      id: editingSession?.id || crypto.randomUUID(),
      disciplineId,
      title: formData.get('title'),
      description: formData.get('description'),
      rewardXp: parseInt(formData.get('rewardXp') as string),
      orderIndex: editingSession?.order_index || sessions.length,
    };

    await saveLearningSession(session);
    setIsModalOpen(false);
    fetchSessions();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar esta sessão apaga também todas as seções e questões vinculadas. Continuar?')) {
      await deleteLearningSession(id);
      fetchSessions();
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-primary">MAPA DA TRILHA...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/admin/learning')} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-primary hover:text-white transition-all"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">{discipline?.title}</h1>
            <p className="text-gray-400 font-medium">Sessões de Aprendizado</p>
          </div>
        </div>
        <button onClick={() => { setEditingSession(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:translate-y-1">
          <Plus size={20} /> NOVA SESSÃO
        </button>
      </div>

      <div className="grid gap-4">
        {sessions.map((s, idx) => (
          <div key={s.id} className="group bg-white p-6 rounded-3xl border-2 border-transparent hover:border-primary transition-all shadow-sm hover:shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-xl">{idx + 1}</div>
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{s.title}</h3>
                <p className="text-sm text-gray-400 font-medium">{s.description}</p>
                <div className="flex gap-4 mt-2">
                   <button onClick={() => navigate(`/admin/learning/sections/${s.id}`)} className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 px-2 py-1 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1"><Layout size={12} /> Seções de Texto</button>
                   <button onClick={() => navigate(`/admin/learning/questions/${s.id}`)} className="text-[10px] font-black uppercase text-secondary tracking-widest bg-secondary/5 px-2 py-1 rounded-lg hover:bg-secondary hover:text-white transition-all flex items-center gap-1"><Target size={12} /> Questões Práticas</button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-lg font-black text-[10px] uppercase mr-4">{s.reward_xp} XP</div>
              <button onClick={() => { setEditingSession(s); setIsModalOpen(true); }} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={18} /></button>
              <button onClick={() => handleDelete(s.id)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">{editingSession ? 'Editar Sessão' : 'Nova Sessão'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400"><X size={32} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Título da Sessão</label>
                <input name="title" required defaultValue={editingSession?.title} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary focus:bg-white outline-none font-bold transition-all text-lg" placeholder="Ex: Introdução à Cinemática" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Resumo/Dica</label>
                <textarea name="description" required defaultValue={editingSession?.description} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-bold h-24" placeholder="O que o aluno vai aprender aqui?" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Recompensa (XP)</label>
                <input name="rewardXp" type="number" required defaultValue={editingSession?.reward_xp || 15} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-bold" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-black text-gray-400 uppercase">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 active:translate-y-1">SALVAR 🚀</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLearningSessionsPage;
