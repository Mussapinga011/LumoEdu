import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSectionsByDiscipline, saveSection, deleteSection } from '../../services/practiceService.supabase';
import { Plus, Edit2, Trash2, ArrowLeft, X, Layers, List } from 'lucide-react';

const AdminLearningSectionsPage = () => {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const navigate = useNavigate();
  const [sections, setSections] = useState<any[]>([]); // "Seções" aqui são Unidades/Capítulos
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any | null>(null);

  useEffect(() => {
    if (disciplineId) fetchSections();
  }, [disciplineId]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const data = await getSectionsByDiscipline(disciplineId!);
      setSections(data || []);
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
      discipline_id: disciplineId,
      title: formData.get('title'),
      description: formData.get('description'),
      order_index: editingSection?.order_index || sections.length,
      // Icon removido pois não existe na tabela
    };

    await saveSection(section);
    setIsModalOpen(false);
    fetchSections();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar esta Unidade/Capítulo? Todas as aulas dentro dela serão perdidas!')) {
      await deleteSection(id);
      fetchSections();
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-secondary">CARREGANDO UNIDADES...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/admin/learning')} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-secondary hover:text-white transition-all"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Unidades de Ensino</h1>
            <p className="text-gray-400 font-medium font-mono text-xs uppercase tracking-widest">Disciplina ID: {disciplineId?.split('-')[0]}</p>
          </div>
        </div>
        <button onClick={() => { setEditingSection(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-black hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 active:translate-y-1">
          <Plus size={20} /> NOVA UNIDADE
        </button>
      </div>

      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="bg-gray-50 p-20 rounded-[40px] text-center border-4 border-dashed border-gray-100">
             <Layers className="mx-auto text-gray-200 mb-6" size={80} />
             <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhuma unidade cadastrada nesta disciplina.</p>
          </div>
        ) : (
          sections.map((s, idx) => (
            <div key={s.id} className="group bg-white p-8 rounded-[32px] border-2 border-transparent hover:border-secondary transition-all shadow-sm hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex gap-6 flex-1 cursor-pointer" onClick={() => navigate(`/admin/learning/${disciplineId}/sections/${s.id}/sessions`)}>
                  <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center font-black text-3xl shrink-0">{s.icon || (idx + 1)}</div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-1">{s.title}</h3>
                    <p className="text-gray-400 font-medium text-sm">{s.description || 'Sem descrição definida.'}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-widest bg-secondary/5 px-3 py-1 rounded-lg w-fit">
                       <List size={14} /> Gerenciar Aulas
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
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter leading-none">{editingSection ? 'Editar Unidade' : 'Nova Unidade'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={32} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Título da Unidade</label>
                <input name="title" required defaultValue={editingSection?.title} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-black text-lg" placeholder="Ex: Mecânica Clássica" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Descrição Breve</label>
                <input name="description" defaultValue={editingSection?.description} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-bold text-gray-600" placeholder="Conceitos fundamentais de movimento e força." />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ícone (Emoji)</label>
                <input name="icon" defaultValue={editingSection?.icon} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-black text-center text-2xl" placeholder="⚙️" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 rounded-3xl">Cancelar</button>
                <button type="submit" className="flex-1 bg-secondary text-white py-5 rounded-3xl font-black shadow-lg shadow-secondary/20 active:translate-y-1 transition-all">SALVAR ✅</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLearningSectionsPage;
