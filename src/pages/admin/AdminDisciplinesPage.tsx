import { useState, useEffect } from 'react';
import { getAllDisciplines, saveDiscipline, deleteDiscipline, getAllUniversities } from '../../services/contentService.supabase';
import { Plus, Edit2, Trash2, Search, Filter, Check, X, Ban } from 'lucide-react';
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

  // Estados locais do formulário para controle visual imediato
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
    
    // Tratamento para isActive que vem do nosso state local (checkbox customizado)
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

  const filtered = disciplines.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUni = filterUniversity === 'all' || d.university_id === filterUniversity;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? d.is_active : !d.is_active);
    return matchesSearch && matchesUni && matchesStatus;
  });

  const toggleStatus = async (item: any) => {
    const newItem = { ...item, is_active: !item.is_active };
    // Otimistic update
    setDisciplines(prev => prev.map(p => p.id === item.id ? newItem : p));
    await saveDiscipline(newItem);
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-secondary uppercase">CATALOGANDO DISCIPLINAS...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-800 tracking-tighter uppercase leading-none">Cadeiras</h1>
            <p className="text-gray-400 font-medium">Gestão avançada de disciplinas.</p>
          </div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-black hover:bg-secondary/90 transition-all shadow-lg shadow-black/5 active:translate-y-1">
            <Plus size={20} /> NOVA DISCIPLINA
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar disciplina..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-secondary/20 bg-white font-medium text-gray-600 outline-none"
            />
          </div>
          
          <div className="flex gap-4">
             <div className="relative min-w-[200px]">
               <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <select 
                  value={filterUniversity}
                  onChange={(e) => setFilterUniversity(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 rounded-xl border-none focus:ring-2 focus:ring-secondary/20 bg-white font-bold text-gray-600 outline-none appearance-none"
               >
                 <option value="all">Todas Universidades</option>
                 {universities.map(u => <option key={u.id} value={u.id}>{u.short_name} - {u.name}</option>)}
               </select>
             </div>

             <div className="bg-white rounded-xl p-1 flex items-center">
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={clsx("px-4 py-2 rounded-lg text-xs font-black transition-all", filterStatus === 'all' ? "bg-gray-100 text-gray-800" : "text-gray-400 hover:text-gray-600")}
                >
                  TODOS
                </button>
                <button 
                  onClick={() => setFilterStatus('active')}
                  className={clsx("px-4 py-2 rounded-lg text-xs font-black transition-all", filterStatus === 'active' ? "bg-green-100 text-green-700" : "text-gray-400 hover:text-green-600")}
                >
                  ATIVOS
                </button>
                <button 
                  onClick={() => setFilterStatus('inactive')}
                  className={clsx("px-4 py-2 rounded-lg text-xs font-black transition-all", filterStatus === 'inactive' ? "bg-red-100 text-red-700" : "text-gray-400 hover:text-red-600")}
                >
                  INATIVOS
                </button>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((d) => (
          <div key={d.id} className={clsx(
            "group bg-white p-8 rounded-[40px] border-2 transition-all shadow-sm hover:shadow-xl relative overflow-hidden",
            d.is_active ? "border-transparent hover:border-secondary" : "border-gray-100 opacity-75 grayscale hover:grayscale-0"
          )}>
            {!d.is_active && (
               <div className="absolute top-4 right-4 bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                 <Ban size={12} /> Desativado
               </div>
            )}

            <div className="flex justify-between items-start mb-6">
               <div className={clsx("w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl", d.color)}>{d.icon || '📚'}</div>
               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => toggleStatus(d)} className={clsx("p-2 rounded-xl transition-colors", d.is_active ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100")}>
                    {d.is_active ? <Check size={20} /> : <Ban size={20} />}
                  </button>
                  <button onClick={() => { setEditingItem(d); setIsModalOpen(true); }} className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl"><Edit2 size={20} /></button>
                  <button onClick={async () => { if(confirm('Excluir?')) { await deleteDiscipline(d.id); fetchData(); } }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={20} /></button>
               </div>
            </div>
            
            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none mb-2">{d.title}</h3>
            
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                {universities.find(u => u.id === d.university_id)?.short_name || 'Geral'}
              </span>
              <span className={clsx("w-3 h-3 rounded-full", d.is_active ? "bg-green-400" : "bg-red-400")} />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-300 font-bold uppercase tracking-widest">
            Nenhuma disciplina encontrada
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter flex items-center justify-between">
              {editingItem ? 'Editar' : 'Nova'} Disciplina
              <button 
                type="button" 
                onClick={() => setFormIsActive(!formIsActive)}
                className={clsx("text-sm px-4 py-2 rounded-full transition-colors flex items-center gap-2", formIsActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}
              >
                {formIsActive ? 'ATIVO' : 'INATIVO'} {formIsActive ? <Check size={16} /> : <Ban size={16} />}
              </button>
            </h2>
            
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Título</label>
                    <input name="title" required defaultValue={editingItem?.title} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary outline-none font-bold" placeholder="Matemática" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Universidade</label>
                    <select name="universityId" defaultValue={editingItem?.university_id || ''} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary outline-none font-bold text-gray-700">
                    <option value="">Geral (Todas)</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
              </div>

              {/* Seletor de Ícones */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Ícone da Disciplina</label>
                <div className="grid grid-cols-8 md:grid-cols-10 gap-2 p-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    {ICONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormIcon(icon)}
                          className={clsx(
                            "aspect-square rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 hover:bg-white hover:shadow-md",
                            formIcon === icon ? "bg-white shadow-md scale-110 ring-2 ring-secondary" : "opacity-60 hover:opacity-100"
                          )}
                        >
                            {icon}
                        </button>
                    ))}
                </div>
              </div>

              {/* Seletor de Cores */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Cor do Tema</label>
                <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    {COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormColor(color)}
                          className={clsx(
                            "w-10 h-10 rounded-full transition-all hover:scale-110 ring-2 ring-offset-2",
                            formColor === color ? "scale-110 ring-gray-400" : "ring-transparent hover:ring-gray-200"
                          )}
                        >
                           <div className={clsx("w-full h-full rounded-full", color.replace('text-', 'bg-'))} />
                        </button>
                    ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-3xl font-black hover:bg-gray-200 transition-colors">CANCELAR</button>
                  <button type="submit" className="flex-[2] bg-secondary text-white py-4 rounded-3xl font-black shadow-lg shadow-black/5 active:translate-y-1 hover:brightness-110 transition-all">SALVAR ALTERAÇÕES ✅</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisciplinesPage;
