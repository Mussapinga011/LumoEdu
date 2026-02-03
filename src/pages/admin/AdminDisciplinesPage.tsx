import { useState, useEffect } from 'react';
import { getAllDisciplines, saveDiscipline, deleteDiscipline, getAllUniversities } from '../../services/contentService.supabase';
import { Plus, Edit2, Trash2, Search, Check, X, Ban, BookMarked, School } from 'lucide-react';
import clsx from 'clsx';

const ICONS = ["📚", "📐", "🌍", "🧬", "⚗️", "⚖️", "🎨", "🎵", "💻", "🧠", "📝", "📊", "🏰", "🦠", "⚡", "🗣️", "🏛️", "🇬🇧", "📉"];
const COLORS = [
  "text-red-500", "text-orange-500", "text-amber-500", 
  "text-green-500", "text-emerald-500", "text-teal-500", 
  "text-cyan-500", "text-blue-500", "text-indigo-500", 
  "text-violet-500", "text-purple-500", "text-fuchsia-500", 
  "text-pink-500", "text-rose-500", "text-slate-500"
];

const AdminDisciplinesPage = () => {
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Estados locais do formulário
  const [formIcon, setFormIcon] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setFormIcon(editingItem.icon || '📚');
      setFormColor(editingItem.color || 'text-gray-500');
      setFormIsActive(editingItem.is_active ?? true);
    } else {
      setFormIcon('📚');
      setFormColor('text-gray-500');
      setFormIsActive(true);
    }
  }, [editingItem, isModalOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, u] = await Promise.all([getAllDisciplines(), getAllUniversities()]);
      setDisciplines(d);
      setUniversities(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    const item = {
      id: editingItem?.id || crypto.randomUUID(),
      title: (formData.get('title') as string) || '',
      university_id: (formData.get('universityId') as string) || null,
      icon: formIcon,
      color: formColor,
      is_active: formIsActive
    };

    await saveDiscipline(item);
    setIsModalOpen(false);
    fetchData();
  };

  const toggleStatus = async (item: any) => {
    const newItem = { ...item, is_active: !item.is_active };
    setDisciplines(prev => prev.map(p => p.id === item.id ? newItem : p));
    await saveDiscipline(newItem);
  };

  const filtered = disciplines.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUni = filterUniversity === 'all' || d.university_id === filterUniversity;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? d.is_active : !d.is_active);
    return matchesSearch && matchesUni && matchesStatus;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Carregando disciplinas...</p>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-gray-200">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
               <BookMarked size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
               Gerenciar Disciplinas
             </h1>
           </div>
          <p className="text-gray-500 font-medium ml-1">
             Organize as matérias e categorias de estudo.
          </p>
        </div>
        
        <button 
           onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
           className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-violet-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
        >
          <Plus size={18} /> Nova Disciplina
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col xl:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" size={20} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar disciplina..." 
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
            />
         </div>
         
         <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative min-w-[240px]">
               <School className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <select 
                  value={filterUniversity}
                  onChange={(e) => setFilterUniversity(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none appearance-none text-gray-600 font-medium"
               >
                 <option value="all">Todas Universidades</option>
                 {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
               </select>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl">
               {[
                  { id: 'all', label: 'Todas' },
                  { id: 'active', label: 'Ativas' },
                  { id: 'inactive', label: 'Inativas' }
               ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => setFilterStatus(opt.id as any)}
                    className={clsx(
                      "px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all", 
                      filterStatus === opt.id 
                         ? "bg-white text-violet-600 shadow-sm" 
                         : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {opt.label}
                  </button>
               ))}
            </div>
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((d) => (
          <div key={d.id} className={clsx(
            "group bg-white p-6 rounded-2xl border transition-all hover:shadow-lg relative overflow-hidden flex flex-col",
            d.is_active ? "border-gray-100 hover:border-violet-200" : "border-gray-100 bg-gray-50/50"
          )}>
            <div className="flex justify-between items-start mb-4">
               <div className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-105 bg-gray-50",
                  d.color
               )}>
                  {d.icon || '📚'}
               </div>
               
               {/* Status Badge */}
               <div className={clsx(
                  "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                  d.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
               )}>
                  {d.is_active ? 'Ativo' : 'Inativo'}
               </div>
            </div>
            
            <h3 className={clsx("text-lg font-bold text-gray-800 mb-1", !d.is_active && "text-gray-500")}>{d.title}</h3>
            
            <div className="text-xs font-medium text-gray-400 mb-6 flex items-center gap-1">
               <School size={12} />
               {universities.find(u => u.id === d.university_id)?.short_name || 'Geral (Todas)'}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                  onClick={() => toggleStatus(d)} 
                  className={clsx("p-2 rounded-lg transition-colors", d.is_active ? "text-gray-400 hover:bg-gray-100" : "text-green-500 hover:bg-green-50")}
                  title={d.is_active ? "Desativar" : "Ativar"}
               >
                 {d.is_active ? <Ban size={16} /> : <Check size={16} />}
               </button>
               <button 
                  onClick={() => { setEditingItem(d); setIsModalOpen(true); }} 
                  className="p-2 text-violet-500 hover:bg-violet-50 rounded-lg transition-colors"
                  title="Editar"
               >
                  <Edit2 size={16} />
               </button>
               <button 
                  onClick={async () => { if(confirm('Excluir esta disciplina?')) { await deleteDiscipline(d.id); fetchData(); } }} 
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
               >
                  <Trash2 size={16} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
         <div className="py-20 text-center">
            <div className="inline-flex p-4 rounded-full bg-gray-50 mb-4 text-gray-300">
               <Search size={32} />
            </div>
            <p className="text-gray-400 font-medium">Nenhuma disciplina encontrada</p>
         </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-gray-800">
                 {editingItem ? 'Editar Disciplina' : 'Nova Disciplina'}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                 <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Título da Disciplina</label>
                    <input name="title" required defaultValue={editingItem?.title} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all" placeholder="Ex: Matemática Financeira" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Universidade</label>
                        <select name="universityId" defaultValue={editingItem?.university_id || ''} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all">
                           <option value="">Geral (Todas)</option>
                           {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Status</label>
                        <button 
                           type="button"
                           onClick={() => setFormIsActive(!formIsActive)}
                           className={clsx(
                              "w-full p-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all",
                              formIsActive ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                           )}
                        >
                           {formIsActive ? <Check size={18} /> : <Ban size={18} />}
                           {formIsActive ? 'Ativa' : 'Inativa'}
                        </button>
                     </div>
                 </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Ícone</label>
                <div className="grid grid-cols-7 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-40 overflow-y-auto">
                    {ICONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormIcon(icon)}
                          className={clsx(
                            "aspect-square rounded-lg flex items-center justify-center text-xl transition-all hover:bg-white hover:shadow-sm",
                            formIcon === icon ? "bg-white shadow-md ring-2 ring-violet-500 scale-105" : "opacity-70 hover:opacity-100"
                          )}
                        >
                            {icon}
                        </button>
                    ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Cor do Tema</label>
                <div className="flex flex-wrap gap-2">
                    {COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormColor(color)}
                          className={clsx(
                            "w-8 h-8 rounded-full transition-all hover:scale-110 ring-2 ring-offset-2",
                            formColor === color ? "scale-110 ring-violet-400" : "ring-transparent hover:ring-gray-200"
                          )}
                        >
                           <div className={clsx("w-full h-full rounded-full border border-black/5", color.replace('text-', 'bg-'))} />
                        </button>
                    ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-violet-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-violet-500/20 hover:bg-violet-700 active:translate-y-0.5 transition-all">Salvar Disciplina</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisciplinesPage;
