import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionsBySection, saveSession, deleteSession, getSyllabusTopicsByDiscipline } from '../../services/practiceService.supabase';
import { Plus, Edit2, Trash2, ArrowLeft, Layout, X, PlayCircle, BookText } from 'lucide-react';

const AdminLearningSessionsPage = () => {
  const { disciplineId, sectionId } = useParams<{ disciplineId: string, sectionId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [syllabusTopics, setSyllabusTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any | null>(null);

  useEffect(() => {
    if (sectionId) {
      fetchSessions();
      fetchSyllabusTopics();
    }
  }, [sectionId, disciplineId]);

  const fetchSyllabusTopics = async () => {
    if (!disciplineId) return;
    try {
      const data = await getSyllabusTopicsByDiscipline(disciplineId);
      setSyllabusTopics(data || []);
    } catch (err) {
      console.error('Erro ao buscar tópicos:', err);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await getSessionsBySection(disciplineId!, sectionId!);
      setSessions(data || []);
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
      section_id: sectionId,
      discipline_id: disciplineId, // Importante para o tracking
      topic_id: formData.get('topic_id') || null,
      title: formData.get('title'),
      description: formData.get('description'),
      order_index: editingSession?.order_index || sessions.length,
    };

    await saveSession(session);
    setIsModalOpen(false);
    fetchSessions();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar esta sessão apaga também todo o conteúdo vinculado. Continuar?')) {
      await deleteSession(id);
      fetchSessions();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Carregando aulas...</p>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-4">
           <button 
              onClick={() => navigate(`/admin/learning/${disciplineId}/sections`)} 
              className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
           >
              <ArrowLeft size={24} />
           </button>
           <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
                  <PlayCircle size={24} />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Aulas & Sessões
                </h1>
              </div>
             <p className="text-gray-500 font-medium ml-1">
                Gerencie as aulas e conteúdos desta unidade.
             </p>
           </div>
        </div>
        
        <button 
           onClick={() => { setEditingSession(null); setIsModalOpen(true); }} 
           className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
        >
          <Plus size={18} /> Nova Sessão
        </button>
      </div>

      {/* Lista de Sessões */}
      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
             <PlayCircle className="mx-auto text-gray-200 mb-4" size={64} />
             <p className="text-gray-400 font-medium">Nenhuma aula cadastrada nesta unidade.</p>
          </div>
        ) : (
          sessions.map((s, idx) => (
            <div key={s.id} className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-cyan-200 transition-all hover:shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => navigate(`/admin/learning/${disciplineId}/sections/${sectionId}/sessions/${s.id}/questions`)}>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-600 rounded-xl flex items-center justify-center font-black text-xl border border-cyan-100">
                   {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                     <span className="text-xs font-bold uppercase text-cyan-600 tracking-wider flex items-center gap-1">
                        <Layout size={12} /> Gerenciar Conteúdo
                     </span>
                     {s.topic_id && (
                       <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black border border-indigo-100 flex items-center gap-1">
                          <BookText size={10} /> {syllabusTopics.find(t => t.id === s.topic_id)?.topic_name || 'Tópico Vinculado'}
                       </span>
                     )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingSession(s); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                   <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                   <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-gray-800">
                 {editingSession ? 'Editar Sessão' : 'Nova Sessão'}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Título da Sessão</label>
                <input name="title" required defaultValue={editingSession?.title} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 outline-none font-bold transition-all" placeholder="Ex: Introdução à Cinemática" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Resumo/Dica</label>
                <textarea name="description" required defaultValue={editingSession?.description} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all h-24 resize-none" placeholder="O que o aluno vai aprender aqui?" />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Vincular ao Edital (Tópico)</label>
                <select 
                  name="topic_id" 
                  defaultValue={editingSession?.topic_id || ''} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-cyan-500 outline-none font-bold"
                >
                  <option value="">Sem vínculo (Opcional)</option>
                  {syllabusTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.topic_name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1 ml-1 italic">
                  * Essencial para o gráfico de progresso e recomendações IA.
                </p>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-[2] bg-cyan-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/20 active:translate-y-0.5 hover:bg-cyan-700 transition-all">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLearningSessionsPage;
