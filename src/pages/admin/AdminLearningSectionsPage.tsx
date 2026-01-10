import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLearningSectionsBySession, saveLearningSection, deleteLearningSection } from '../../services/contentService.supabase';
import { Plus, Edit2, Trash2, ArrowLeft, X, Type, FileStack } from 'lucide-react';

const AdminLearningSectionsPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);

  useEffect(() => {
    if (sessionId) fetchSections();
  }, [sessionId]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const data = await getLearningSectionsBySession(sessionId!);
      setSections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const section = {
      id: editingSection?.id || crypto.randomUUID(),
      sessionId,
      title: formData.get('title'),
      content: formData.get('content'),
      orderIndex: editingSection?.order_index || sections.length,
    };

    await saveLearningSection(section);
    setIsModalOpen(false);
    fetchSections();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar esta seção teórica?')) {
      await deleteLearningSection(id);
      fetchSections();
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-secondary">ORGANIZANDO TEORIA...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-secondary hover:text-white transition-all"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Teoria & Conteúdo</h1>
            <p className="text-gray-400 font-medium font-mono text-xs uppercase tracking-widest">Sessão ID: {sessionId?.slice(0, 8)}...</p>
          </div>
        </div>
        <button onClick={() => { setEditingSection(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-black hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 active:translate-y-1">
          <Plus size={20} /> NOVA PÁGINA
        </button>
      </div>

      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="bg-gray-50 p-20 rounded-[40px] text-center border-4 border-dashed border-gray-100">
             <FileStack className="mx-auto text-gray-200 mb-6" size={80} />
             <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhuma página de conteúdo ainda.</p>
          </div>
        ) : (
          sections.map((s, idx) => (
            <div key={s.id} className="group bg-white p-8 rounded-[32px] border-2 border-transparent hover:border-secondary transition-all shadow-sm hover:shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center font-black text-xl shrink-0">{idx + 1}</div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-2">{s.title}</h3>
                    <div className="text-gray-400 font-medium line-clamp-3 prose prose-sm max-w-none prose-p:leading-relaxed text-sm">
                      {s.content}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4 shrink-0">
                  <button onClick={() => { setEditingSection(s); setIsModalOpen(true); }} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-2xl shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter leading-none">{editingSection ? 'Ajustar Conteúdo' : 'Novo Bloco Teórico'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400"><X size={32} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Título do Tópico</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input name="title" required defaultValue={editingSection?.title} className="w-full pl-12 p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-black text-lg" placeholder="Ex: Aceleração Escalar" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Conteúdo Teórico (Markdown/HTML)</label>
                <textarea name="content" required defaultValue={editingSection?.content} className="w-full p-6 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-secondary outline-none font-bold h-64 resize-y leading-relaxed" placeholder="Escreva aqui a teoria detalhada..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-black text-gray-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 bg-secondary text-white py-5 rounded-3xl font-black shadow-lg shadow-secondary/20 active:translate-y-1 transition-all">PUBLICAR ✍️</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLearningSectionsPage;
