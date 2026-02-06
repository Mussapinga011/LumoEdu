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
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-cyan-900 to-teal-950 p-6 md:p-8 rounded-[2rem] text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-400/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/admin/learning')} 
                className="p-2.5 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all active:scale-95"
            >
                <ArrowLeft size={18} />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-teal-300 text-[10px] font-black uppercase tracking-[0.15em] mb-3 border border-white/10">
                <Layers size={12} /> Arquitetura de Ensino
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-1 leading-none uppercase italic">
                UNIDADES DE <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent italic">ENSINO</span>
              </h1>
              <p className="text-teal-100/70 font-medium max-w-md text-sm italic">
                Organize os capítulos e módulos desta disciplina geral.
              </p>
            </div>
          </div>
          
          <button 
             onClick={() => { setEditingSection(null); setIsModalOpen(true); }} 
             className="flex items-center gap-2 bg-white text-teal-950 px-6 py-3 rounded-xl font-black text-sm hover:bg-white/90 transition-all shadow-lg active:scale-95 group uppercase tracking-tighter"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Nova Unidade
          </button>
        </div>
      </div>

      {/* Lista de Seções */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
             <Layers className="mx-auto text-gray-200 mb-4" size={48} />
             <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Plano de aula vazio nesta disciplina.</p>
          </div>
        ) : (
          sections.map((s, idx) => (
            <div key={s.id} className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-teal-200 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 flex-1 cursor-pointer" onClick={() => navigate(`/admin/learning/${disciplineId}/sections/${s.id}/sessions`)}>
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-600 rounded-xl flex items-center justify-center font-black text-xl shrink-0 border border-teal-100 shadow-sm">
                     {s.icon || (idx + 1)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-800 leading-tight uppercase tracking-tighter mb-0.5">{s.title}</h3>
                    <p className="text-gray-400 font-bold text-[10px] line-clamp-1 italic">{s.description || 'Sem descrição definida.'}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[9px] font-black text-teal-600 uppercase tracking-[0.15em] opacity-70 group-hover:opacity-100 transition-opacity">
                       <List size={12} /> Gerenciar Aulas
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 ml-4 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setEditingSection(s); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                     <Edit2 size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                     <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-3xl border-4 border-white animate-in zoom-in-95 duration-200 relative custom-scrollbar">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full -translate-y-24 translate-x-24 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div>
                 <h2 className="text-2xl font-black tracking-tighter uppercase italic">{editingSection ? 'Editar Unidade' : 'Nova Unidade'}</h2>
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-1 italic">Gestão de Módulos</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-400 p-2 rounded-full hover:bg-gray-200 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5 relative z-10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título da Unidade</label>
                <input name="title" required defaultValue={editingSection?.title} className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl outline-none font-bold text-gray-800 transition-all text-base shadow-inner italic" placeholder="Ex: Mecânica Clássica" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição Breve</label>
                <input name="description" defaultValue={editingSection?.description} className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl outline-none font-bold text-gray-800 transition-all text-sm shadow-inner" placeholder="Conceitos fundamentais de movimento e força." />
              </div>
              <div className="space-y-1.5 text-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ícone Representativo</label>
                <input name="icon" defaultValue={editingSection?.icon} className="w-20 h-20 mx-auto bg-gray-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-[1.5rem] outline-none font-black text-center text-3xl shadow-inner transition-all" placeholder="⚙️" />
              </div>
              
              <div className="flex gap-3 pt-6">
                <button type="submit" className="flex-1 bg-teal-600 text-white py-4 rounded-xl font-black text-base shadow-xl shadow-teal-500/20 active:scale-95 hover:bg-teal-700 transition-all uppercase tracking-tighter">
                  {editingSection ? 'Atualizar Unidade' : 'Fundar Unidade'}
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
