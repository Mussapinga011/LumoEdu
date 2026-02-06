import { useState, useEffect, useCallback } from 'react';
import { getAllDisciplines, saveDiscipline, deleteDiscipline, getAllUniversities } from '../../services/contentService.supabase';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  Ban, 
  BookMarked, 
  School,
  AlertCircle,
  CheckCircle2,
  Layers,
  Palette,
  Layout,
  Loader2,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import clsx from 'clsx';

const ICONS = ["📚", "📐", "🌍", "🧬", "⚗️", "⚖️", "🎨", "🎵", "💻", "🧠", "📝", "📊", "🏰", "🦠", "⚡", "🗣️", "🏛️", "🇬🇧", "📉", "🔭", "🎭", "🍕", "🦾", "🩺", "🧪"];
const COLORS = [
  "text-red-500", "text-orange-500", "text-amber-500", 
  "text-green-500", "text-emerald-500", "text-teal-500", 
  "text-cyan-500", "text-blue-500", "text-indigo-500", 
  "text-violet-500", "text-purple-500", "text-fuchsia-500", 
  "text-pink-500", "text-rose-500"
];

const AdminDisciplinesPage = () => {
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [saving, setSaving] = useState(false);

  const [formIcon, setFormIcon] = useState('📚');
  const [formColor, setFormColor] = useState('text-violet-500');
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [d, u] = await Promise.all([getAllDisciplines(), getAllUniversities()]);
      setDisciplines(d);
      setUniversities(u);
    } catch (err: any) {
      console.error('Error fetching disciplines:', err);
      setToast({ message: 'Erro ao sincronizar matérias.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (editingItem) {
      setFormIcon(editingItem.icon || '📚');
      setFormColor(editingItem.color || 'text-violet-500');
      setFormIsActive(editingItem.is_active ?? true);
    } else {
      setFormIcon('📚');
      setFormColor('text-violet-500');
      setFormIsActive(true);
    }
  }, [editingItem, isModalOpen]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    try {
      const item = {
        id: editingItem?.id || crypto.randomUUID(),
        title: (formData.get('title') as string) || '',
        university_id: (formData.get('universityId') as string) || null,
        icon: formIcon,
        color: formColor,
        is_active: formIsActive
      };

      await saveDiscipline(item);
      setToast({ message: `Disciplina ${editingItem ? 'atualizada' : 'criada'}!`, type: 'success' });
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao processar disciplina', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: any) => {
    try {
      const newItem = { ...item, is_active: !item.is_active };
      setDisciplines(prev => prev.map(p => p.id === item.id ? newItem : p));
      await saveDiscipline(newItem);
      setToast({ message: `Status de "${item.title}" alterado.`, type: 'info' });
    } catch (error) {
      setToast({ message: 'Falha ao alterar status.', type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDiscipline(deleteConfirm.id);
      setToast({ message: 'Disciplina removida do mapa.', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Erro ao excluir disciplina.', type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filtered = disciplines.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUni = filterUniversity === 'all' || d.university_id === filterUniversity;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? d.is_active : !d.is_active);
    return matchesSearch && matchesUni && matchesStatus;
  });

  if (loading && disciplines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-16 h-16 text-violet-500 animate-spin" />
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-xs">Organizando Currículo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Toast System */}
      {toast && (
        <div className={clsx(
          "fixed top-6 right-6 z-[100] max-w-md p-5 rounded-2xl shadow-2xl border-l-4 animate-in slide-in-from-right duration-300 flex items-start gap-4 backdrop-blur-md",
          toast.type === 'error' ? 'bg-white/90 border-red-500' : 
          toast.type === 'success' ? 'bg-white/90 border-violet-500' : 'bg-white/90 border-blue-500'
        )}>
          <div className={clsx(
            "p-2.5 rounded-xl shrink-0",
            toast.type === 'error' ? 'bg-red-100 text-red-600' : 
            toast.type === 'success' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'
          )}>
            {toast.type === 'error' ? <AlertCircle size={24} /> : 
             toast.type === 'success' ? <CheckCircle2 size={24} /> : <Layers size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-gray-800 text-lg leading-tight uppercase tracking-tighter italic">
              {toast.type === 'error' ? 'Falha' : 
               toast.type === 'success' ? 'Sucesso' : 'Notificação'}
            </h3>
            <p className="text-gray-600 text-sm font-medium mt-1 leading-relaxed italic">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-violet-900 to-fuchsia-950 p-6 md:p-8 rounded-[2rem] text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-400/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-violet-200 text-[10px] font-black uppercase tracking-[0.15em] mb-3 border border-white/10 italic">
              <BookMarked size={12} /> Mapa de Conhecimento
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-3 leading-none uppercase italic">
              GERIR <span className="bg-gradient-to-r from-violet-400 to-fuchsia-300 bg-clip-text text-transparent italic">DISCIPLINAS</span>
            </h1>
            <p className="text-violet-100/70 font-medium max-w-md text-sm italic leading-tight">
              Organize os pilares do aprendizado e defina a estrutura curricular da plataforma.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-auto">
            <button 
              onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
              className="flex items-center justify-center gap-2 bg-white text-violet-950 px-6 py-3 rounded-xl font-black text-sm hover:bg-violet-50 transition-all shadow-lg shadow-white/10 active:scale-95 group uppercase italic"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
              NOVA MATÉRIA
            </button>
            <div className="flex items-center justify-center md:justify-end gap-8 text-violet-200/50">
              <div className="text-center">
                <div className="text-2xl font-black text-white italic">{disciplines.length}</div>
                <div className="text-[9px] uppercase font-bold tracking-[0.15em] mt-0.5">Total</div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center">
                <div className="text-2xl font-black text-white italic">{disciplines.filter(d => d.is_active).length}</div>
                <div className="text-[9px] uppercase font-bold tracking-[0.15em] mt-0.5">Ativas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Control Bar */}
      <div className="flex flex-col xl:flex-row gap-4 bg-white p-4 rounded-[1.5rem] shadow-lg border border-gray-50 items-center">
         <div className="flex-1 relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors" size={18} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome da disciplina..." 
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-violet-500 focus:bg-white outline-none rounded-xl text-sm font-bold text-gray-800 transition-all shadow-inner italic"
            />
         </div>
         
         <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative min-w-[240px]">
               <School className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <select 
                  value={filterUniversity}
                  onChange={(e) => setFilterUniversity(e.target.value)}
                  className="w-full pl-11 pr-8 py-3 bg-gray-50 border-2 border-transparent focus:border-violet-500 outline-none rounded-xl text-sm font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:18px] bg-[right_1rem_center] bg-no-repeat shadow-inner italic"
               >
                 <option value="all">Todas Universidades</option>
                 <option value="">Foco Geral</option>
                 {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
               </select>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl">
               {[
                  { id: 'all', label: 'TUDO' },
                  { id: 'active', label: 'ATIVAS' },
                  { id: 'inactive', label: 'OFF' }
               ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => setFilterStatus(opt.id as any)}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", 
                      filterStatus === opt.id 
                         ? "bg-white text-violet-600 shadow-md scale-105" 
                         : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {opt.label}
                  </button>
               ))}
            </div>
         </div>
      </div>

      {/* Disciplines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filtered.map((d) => (
          <div key={d.id} className={clsx(
            "group bg-white p-8 rounded-[2.5rem] border-2 transition-all hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden flex flex-col",
            d.is_active ? "border-gray-50 hover:border-violet-200" : "border-gray-100 bg-gray-50/50 grayscale opacity-60"
          )}>
            {/* Pattern Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -translate-y-16 translate-x-16 opacity-50 font-black group-hover:scale-150 transition-transform duration-700"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
               <div className={clsx(
                  "w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-3xl shadow-lg ring-4 ring-white transition-all group-hover:rotate-12 bg-white",
                  d.color
               )}>
                  {d.icon || '📚'}
               </div>
               
               <div className={clsx(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border-2",
                  d.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-200 text-gray-500 border-gray-300"
               )}>
                  <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", d.is_active ? "bg-emerald-500" : "bg-gray-400")} />
                  {d.is_active ? 'Ativo' : 'Inativo'}
               </div>
            </div>
            
            <h3 className={clsx("text-2xl font-black text-gray-800 mb-2 tracking-tighter uppercase italic leading-tight group-hover:text-violet-600 transition-colors", !d.is_active && "text-gray-500")}>
              {d.title}
            </h3>
            
            <div className="text-[10px] font-black text-gray-300 mb-8 flex items-center gap-2 uppercase tracking-widest italic">
               <div className="w-8 h-[2px] bg-gray-100 group-hover:w-12 group-hover:bg-violet-200 transition-all"></div>
               {universities.find(u => u.id === d.university_id)?.short_name || 'Geral (Padrão)'}
            </div>

            <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 relative z-10">
               <button 
                  onClick={() => toggleStatus(d)} 
                  className={clsx("p-3 rounded-xl transition-all shadow-sm", d.is_active ? "bg-gray-50 text-gray-400 hover:bg-gray-200" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100")}
                  title={d.is_active ? "Desativar" : "Ativar"}
               >
                 {d.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
               <button 
                  onClick={() => { setEditingItem(d); setIsModalOpen(true); }} 
                  className="p-3 bg-violet-50 text-violet-500 hover:bg-violet-600 hover:text-white rounded-xl transition-all shadow-sm"
                  title="Editar Estrutura"
               >
                  <Edit2 size={18} />
               </button>
               <button 
                  onClick={() => setDeleteConfirm({ id: d.id, title: d.title })} 
                  className="p-3 bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                  title="Expurgar"
               >
                  <Trash2 size={18} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
         <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-inner">
            <div className="inline-flex p-8 rounded-[2rem] bg-gray-50 mb-6 text-gray-200 rotate-12 group">
               <Search size={48} className="group-hover:scale-125 transition-transform" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">O currículo está limpo</h2>
            <p className="text-gray-400 font-medium italic mt-2">Nenhuma disciplina encontrada para os filtros aplicados.</p>
         </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] p-10 md:p-12 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-3xl border-4 border-white animate-in zoom-in-95 duration-200 relative custom-scrollbar">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full -translate-y-32 translate-x-32 pointer-events-none opacity-50"></div>
            
            <div className="flex items-center justify-between mb-10 relative z-10">
               <div>
                 <h2 className="text-4xl font-black tracking-tighter uppercase italic text-gray-800">
                   {editingItem ? 'Configurar Recurso' : 'Novo Conhecimento'}
                 </h2>
                 <p className="text-violet-500 font-bold uppercase tracking-widest text-[10px] mt-1 italic">Estrutura Curricular</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-400 p-3 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                  <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Título da Disciplina</label>
                  <input 
                    name="title" 
                    required 
                    defaultValue={editingItem?.title} 
                    className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-violet-500 focus:bg-white outline-none rounded-[1.5rem] font-bold text-gray-800 transition-all italic text-xl shadow-inner placeholder:text-gray-300" 
                    placeholder="Ex: Física Quântica Avançada" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Instituição Alvo</label>
                  <select 
                    name="universityId" 
                    defaultValue={editingItem?.university_id || ''} 
                    className="w-full p-6 bg-gray-50 border-transparent focus:border-violet-500 outline-none rounded-2xl font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:22px] bg-[right_1.5rem_center] bg-no-repeat shadow-inner italic"
                  >
                    <option value="">Foco Geral (Padrão)</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.short_name} - {u.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado Operacional</label>
                  <button 
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={clsx(
                      "w-full p-6 rounded-2xl border-2 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-sm italic",
                      formIsActive ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
                    )}
                  >
                    {formIsActive ? <Shield size={18} className="animate-bounce" /> : <Ban size={18} />}
                    {formIsActive ? 'Matéria Ativa' : 'Matéria Suspensa'}
                  </button>
                </div>
              </div>

              {/* Icon Selector Premium */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                   <Layout size={14} /> Identidade Visual (Ícone)
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 p-6 bg-gray-50 rounded-[2rem] border-2 border-gray-100/50 shadow-inner max-h-48 overflow-y-auto custom-scrollbar">
                    {ICONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormIcon(icon)}
                          className={clsx(
                            "aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all hover:bg-white hover:shadow-xl hover:scale-110",
                            formIcon === icon ? "bg-white shadow-2xl ring-4 ring-violet-500/20 scale-110" : "opacity-40 hover:opacity-100"
                          )}
                        >
                            {icon}
                        </button>
                    ))}
                </div>
              </div>

              {/* Color Palette Premium */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                   <Palette size={14} /> Cor do Tema
                </div>
                <div className="flex flex-wrap gap-4 p-6 bg-white rounded-3xl border-2 border-gray-50 shadow-sm">
                    {COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormColor(color)}
                          className={clsx(
                            "w-10 h-10 rounded-full transition-all hover:scale-125 ring-4 ring-offset-4",
                            formColor === color ? "scale-125 ring-violet-400 shadow-lg shadow-violet-200" : "ring-transparent hover:ring-gray-100"
                          )}
                        >
                           <div className={clsx("w-full h-full rounded-full border border-white shadow-inner", color.replace('text-', 'bg-'))} />
                        </button>
                    ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                  <button type="submit" disabled={saving} className="flex-[2] bg-primary text-white py-6 rounded-3xl font-black text-2xl shadow-2xl shadow-primary/30 active:scale-95 hover:bg-violet-700 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter italic">
                     {saving ? <Loader2 className="animate-spin" /> : <BookMarked size={28} />}
                     {editingItem ? 'SALVAR ALTERAÇÕES' : 'LANÇAR NO MAPA'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors italic">DESISTIR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex items-center justify-center z-[130] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] p-12 w-full max-w-md text-center shadow-3xl border-4 border-red-50 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 rotate-12 shadow-lg shadow-red-100 ring-4 ring-white">
              <Trash2 size={48} />
            </div>
            
            <h2 className="text-4xl font-black text-gray-800 mb-4 tracking-tighter uppercase italic">Expurgar Disciplina?</h2>
            <p className="text-gray-500 font-medium mb-10 text-lg leading-relaxed italic">
              A disciplina <span className="text-gray-800 font-black">"{deleteConfirm.title}"</span> será apagada. 
              Isso pode gerar inconsistências em questões vinculadas.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete} 
                className="w-full bg-red-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-red-200 active:scale-95 transition-all uppercase tracking-tighter italic"
              >
                Sim, Remover Agora
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="w-full py-4 font-black text-gray-400 uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors italic"
              >
                Cancelar Operação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisciplinesPage;
