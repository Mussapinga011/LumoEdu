import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSectionsByDiscipline, saveSection, deleteSection } from '../../services/practiceService.supabase';
import { Plus, Edit2, Trash2, ArrowLeft, X, Layers, List } from 'lucide-react';

const AdminLearningSectionsPage = () => {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const navigate = useNavigate();
  const [sections, setSections] = useState<any[]>([]);
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Carregando unidades...</p>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-4">
           <button 
              onClick={() => navigate('/admin/learning')} 
              className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
           >
              <ArrowLeft size={24} />
           </button>
           <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                  <Layers size={24} />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Unidades de Ensino
                </h1>
              </div>
             <p className="text-gray-500 font-medium ml-1">
                Organize os capítulos e módulos da disciplina.
             </p>
           </div>
        </div>
        
        <button 
           onClick={() => { setEditingSection(null); setIsModalOpen(true); }} 
           className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
        >
          <Plus size={18} /> Nova Unidade
        </button>
      </div>

      {/* Lista de Seções */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
             <Layers className="mx-auto text-gray-200 mb-4" size={64} />
             <p className="text-gray-400 font-medium">Nenhuma unidade cadastrada nesta disciplina.</p>
          </div>
        ) : (
          sections.map((s, idx) => (
            <div key={s.id} className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-teal-200 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 flex-1 cursor-pointer" onClick={() => navigate(`/admin/learning/${disciplineId}/sections/${s.id}/sessions`)}>
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-600 rounded-xl flex items-center justify-center font-black text-2xl shrink-0 border border-teal-100">
                     {s.icon || (idx + 1)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{s.title}</h3>
                    <p className="text-gray-500 text-sm">{s.description || 'Sem descrição definida.'}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider">
                       <List size={14} /> Gerenciar Aulas
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4 shrink-0">
                  <button onClick={() => { setEditingSection(s); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                     <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                     <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-gray-800">
                 {editingSection ? 'Editar Unidade' : 'Nova Unidade'}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Título da Unidade</label>
                <input name="title" required defaultValue={editingSection?.title} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none font-bold transition-all" placeholder="Ex: Mecânica Clássica" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Descrição Breve</label>
                <input name="description" defaultValue={editingSection?.description} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all" placeholder="Conceitos fundamentais de movimento e força." />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Ícone (Emoji)</label>
                <input name="icon" defaultValue={editingSection?.icon} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none font-bold text-center text-2xl" placeholder="⚙️" />
              </div>
              
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-[2] bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 active:translate-y-0.5 hover:bg-teal-700 transition-all">
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

export default AdminLearningSectionsPage;
