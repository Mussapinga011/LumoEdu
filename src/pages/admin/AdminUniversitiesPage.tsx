import { useState, useEffect, useCallback } from 'react';
import { getAllUniversities, saveUniversity, deleteUniversity, University } from '../../services/contentService.supabase';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  School, 
  X, 
  Search, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Layers,
  Loader2,
  Building2
} from 'lucide-react';
import clsx from 'clsx';

const AdminUniversitiesPage = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<University | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllUniversities();
      setUniversities(data);
    } catch (err: any) {
      console.error('Error loading universities:', err);
      setToast({ 
        message: `Falha ao carregar instituições: ${err.message || 'Erro de conexão'}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    const name = (formData.get('name') as string) || '';
    const shortName = (formData.get('shortName') as string) || '';

    if (!name || !shortName) {
      setToast({ message: 'Todos os campos são obrigatórios.', type: 'error' });
      setSaving(false);
      return;
    }

    try {
      const item = {
        id: editingItem?.id || crypto.randomUUID(),
        name,
        short_name: shortName.toUpperCase()
      };

      await saveUniversity(item);
      setToast({ 
        message: `Instituição ${editingItem ? 'atualizada' : 'cadastrada'} com sucesso!`, 
        type: 'success' 
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao salvar universidade', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteUniversity(deleteConfirm.id);
      setToast({ message: `A instituição "${deleteConfirm.name}" foi removida.`, type: 'success' });
      fetchData();
    } catch (error: any) {
      setToast({ message: 'Erro ao excluir universidade.', type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredUniversities = universities.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && universities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-xs">Mapeando Instituições...</p>
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
          toast.type === 'success' ? 'bg-white/90 border-emerald-500' : 'bg-white/90 border-blue-500'
        )}>
          <div className={clsx(
            "p-2.5 rounded-xl shrink-0",
            toast.type === 'error' ? 'bg-red-100 text-red-600' : 
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
          )}>
            {toast.type === 'error' ? <AlertCircle size={24} /> : 
             toast.type === 'success' ? <CheckCircle2 size={24} /> : <Layers size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-gray-800 text-lg leading-tight uppercase tracking-tighter">
              {toast.type === 'error' ? 'Erro no Mapeamento' : 
               toast.type === 'success' ? 'Operação Concluída' : 'Info'}
            </h3>
            <p className="text-gray-600 text-sm font-medium mt-1 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 p-6 md:p-8 rounded-[2rem] text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-emerald-300 text-[10px] font-black uppercase tracking-[0.15em] mb-3 border border-white/10">
              <Shield size={12} /> Estrutura Acadêmica
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-3 leading-none uppercase italic">
              GESTÃO DE <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent italic">UNIVERSIDADES</span>
            </h1>
            <p className="text-emerald-100/70 font-medium max-w-md text-sm italic leading-tight">
              Ajuste as instituições parceiras e controle o direcionamento dos conteúdos por campus.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-auto">
            <button 
              onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
              className="flex items-center justify-center gap-2 bg-white text-emerald-950 px-6 py-3 rounded-xl font-black text-sm hover:bg-emerald-50 transition-all shadow-lg shadow-white/10 active:scale-95 group uppercase"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
              NOVA INSTITUIÇÃO
            </button>
            <div className="flex items-center justify-center md:justify-end gap-6 text-emerald-200/50">
              <div className="text-center">
                <div className="text-2xl font-black text-white italic">{universities.length}</div>
                <div className="text-[9px] uppercase font-bold tracking-[0.15em] mt-0.5">Ativas</div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center">
                <div className="text-2xl font-black text-white italic">0</div>
                <div className="text-[9px] uppercase font-bold tracking-[0.15em] mt-0.5">Pendentes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou sigla..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all shadow-sm italic"
          />
        </div>
      </div>

      {/* Universities Grid */}
      {filteredUniversities.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-200 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <School size={32} />
          </div>
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-tighter italic">Nenhum campus mapeado</h2>
          <p className="text-sm text-gray-400 font-medium mt-1 italic">Tente mudar sua busca ou adicione uma nova universidade.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUniversities.map((uni) => (
            <div key={uni.id} className="group bg-white rounded-[2rem] p-6 border-2 border-gray-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col items-center text-center">
               
               {/* Pattern Background */}
               <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
               
               {/* Institutional Badge */}
               <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-xl flex items-center justify-center mb-4 shadow-inner text-emerald-700 font-black text-xl tracking-tighter border-2 border-white ring-2 ring-emerald-50/50 group-hover:rotate-6 transition-transform">
                  {uni.short_name?.slice(0, 3) || <Building2 size={20} />}
               </div>

               <h3 className="text-lg font-black text-gray-800 mb-1.5 leading-tight uppercase tracking-tighter line-clamp-1 italic">
                 {uni.name}
               </h3>
               <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black uppercase tracking-[0.15em] rounded-full mb-6 italic">
                  <Building2 size={10} /> {uni.short_name || 'Instituição'}
               </div>
               
               {/* Footer Info */}
               <div className="mt-auto w-full pt-4 border-t border-gray-50 flex items-center justify-between relative z-10">
                 <div className="flex gap-1.5 text-gray-300 items-center">
                    <Layers size={12} />
                    <span className="text-[8px] font-black uppercase tracking-widest italic">Bacharelados</span>
                 </div>
                 
                 <div className="flex gap-1">
                    <button 
                       onClick={() => { setEditingItem(uni); setIsModalOpen(true); }} 
                       className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shadow-sm"
                       title="Editar Configurações"
                    >
                       <Edit2 size={14} />
                    </button>
                    <button 
                       onClick={() => setDeleteConfirm({ id: uni.id, name: uni.name })} 
                       className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shadow-sm"
                       title="Remover Unidade"
                    >
                       <Trash2 size={14} />
                    </button>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] p-10 md:p-12 w-full max-w-sm shadow-3xl border-4 border-white animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="flex items-center justify-between mb-10">
               <div>
                 <h2 className="text-3xl font-black tracking-tighter uppercase italic text-gray-800">
                   {editingItem ? 'Editar' : 'Nova'} Instituição
                 </h2>
                 <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px] mt-1 italic">Configuração do Campus</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-400 p-3 rounded-full hover:bg-red-50 hover:text-red-500 transition-all">
                  <X size={24} />
               </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  name="name" 
                  required 
                  defaultValue={editingItem?.name} 
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none rounded-2xl font-bold text-gray-800 transition-all italic text-lg shadow-inner placeholder:text-gray-300" 
                  placeholder="Ex: Universidade de Luanda" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Sigla / ID Curto</label>
                <input 
                  name="shortName" 
                  required 
                  defaultValue={editingItem?.short_name} 
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none rounded-2xl font-black text-center text-3xl text-emerald-600 transition-all shadow-inner placeholder:text-gray-200 uppercase tracking-tighter italic" 
                  placeholder="UEM" 
                />
              </div>
              
              <div className="flex flex-col gap-3 mt-10">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-xl shadow-xl shadow-emerald-200 active:scale-95 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                  {editingItem ? 'ATUALIZAR' : 'CONSOLIDAR'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full py-2 font-black text-gray-400 uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors italic"
                >
                  Desistir e Voltar
                </button>
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
            
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 rotate-12 shadow-lg shadow-red-100 flex-none ring-4 ring-white">
              <Trash2 size={48} />
            </div>
            
            <h2 className="text-4xl font-black text-gray-800 mb-4 tracking-tighter uppercase italic">Expurgar Campus?</h2>
            <p className="text-gray-500 font-medium mb-10 text-lg leading-relaxed italic">
              A instituição <span className="text-gray-800 font-black">"{deleteConfirm.name}"</span> será removida. 
              Cuidado: isso pode afetar disciplinas vinculadas.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete} 
                className="w-full bg-red-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-red-200 active:scale-95 transition-all uppercase tracking-tighter"
              >
                SIM, REMOVER AGORA
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="w-full py-4 font-black text-gray-400 uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors italic"
              >
                CANCELAR MUDANÇA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUniversitiesPage;
