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
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-950 p-6 md:p-8 rounded-[2rem] text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 text-left">
            <button 
                onClick={() => navigate(`/admin/learning/${disciplineId}/sections`)} 
                className="p-2.5 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all active:scale-95"
            >
                <ArrowLeft size={18} />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-cyan-300 text-[10px] font-black uppercase tracking-[0.15em] mb-3 border border-white/10">
                <PlayCircle size={12} /> Produção de Conteúdo
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-1 leading-none uppercase italic">
                AULAS & <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent italic">SESSÕES</span>
              </h1>
              <p className="text-cyan-100/70 font-medium max-w-md text-sm italic">
                Gerencie as aulas e conteúdos específicos desta unidade de ensino.
              </p>
            </div>
          </div>
          
          <button 
             onClick={() => { setEditingSession(null); setIsModalOpen(true); }} 
             className="flex items-center gap-2 bg-white text-indigo-950 px-6 py-3 rounded-xl font-black text-sm hover:bg-white/90 transition-all shadow-lg active:scale-95 group uppercase tracking-tighter"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Nova Sessão
          </button>
        </div>
      </div>

      {/* Lista de Sessões */}
      <div className="grid grid-cols-1 gap-3">
        {sessions.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
             <PlayCircle className="mx-auto text-gray-200 mb-4" size={48} />
             <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Nenhuma aula nesta unidade.</p>
          </div>
        ) : (
          sessions.map((s, idx) => (
            <div key={s.id} className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-cyan-200 transition-all hover:shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => navigate(`/admin/learning/${disciplineId}/sections/${sectionId}/sessions/${s.id}/questions`)}>
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-600 rounded-xl flex items-center justify-center font-black text-sm border border-cyan-100 shadow-sm">
                   {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-gray-800 leading-tight uppercase tracking-tighter mb-0.5">{s.title}</h3>
                  <div className="flex flex-wrap items-center gap-3">
                     <span className="text-[9px] font-black uppercase text-cyan-600 tracking-[0.15em] flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Layout size={12} /> Gerenciar Conteúdo
                     </span>
                     {s.topic_id && (
                       <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black border border-indigo-100 flex items-center gap-1">
                          <BookText size={10} /> {syllabusTopics.find(t => t.id === s.topic_id)?.topic_name || 'Tópico Vinculado'}
                       </span>
                     )}
                     <p className="text-[10px] text-gray-400 font-bold italic line-clamp-1">{s.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                <button onClick={(e) => { e.stopPropagation(); setEditingSession(s); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                   <Edit2 size={16} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                   <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-3xl border-4 border-white animate-in zoom-in-95 duration-200 relative custom-scrollbar">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full -translate-y-24 translate-x-24 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div>
                 <h2 className="text-2xl font-black tracking-tighter uppercase italic">{editingSession ? 'Editar Sessão' : 'Nova Sessão'}</h2>
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-1 italic">Gestão de Conteúdo</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-400 p-2 rounded-full hover:bg-gray-200 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título da Sessão</label>
                <input name="title" required defaultValue={editingSession?.title} className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-cyan-500 focus:bg-white rounded-xl outline-none font-bold text-gray-800 transition-all text-base shadow-inner italic" placeholder="Ex: Introdução à Cinemática" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Resumo/Dica</label>
                <textarea name="description" required defaultValue={editingSession?.description} className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-cyan-500 focus:bg-white rounded-xl outline-none font-medium text-gray-800 transition-all h-24 resize-none shadow-inner text-sm" placeholder="O que o aluno vai aprender aqui?" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vincular ao Edital (Tópico)</label>
                <select 
                  name="topic_id" 
                  defaultValue={editingSession?.topic_id || ''} 
                  className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-cyan-500 outline-none font-bold text-gray-800 rounded-xl appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:18px] bg-[right_1rem_center] bg-no-repeat text-sm"
                >
                  <option value="">Sem vínculo (Opcional)</option>
                  {syllabusTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.topic_name}</option>
                  ))}
                </select>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-1 opacity-60">
                  * Essencial para progresso e recomendações IA.
                </p>
              </div>
              
              <div className="flex gap-3 pt-6">
                <button type="submit" className="flex-1 bg-cyan-600 text-white py-4 rounded-xl font-black text-base shadow-xl shadow-cyan-500/20 active:scale-95 hover:bg-cyan-700 transition-all uppercase tracking-tighter">
                  {editingSession ? 'Atualizar Aula' : 'Publicar Aula'}
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
