import { useState, useEffect } from 'react';
import { getAllUniversities, saveUniversity, deleteUniversity } from '../../services/contentService.supabase';
import { Plus, Edit2, Trash2, School, X } from 'lucide-react';

const AdminUniversitiesPage = () => {
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllUniversities();
      setUniversities(data);
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
      name: (formData.get('name') as string) || '',
      short_name: (formData.get('shortName') as string) || ''
    };

    await saveUniversity(item as any);
    setIsModalOpen(false);
    fetchData();
  };

  if (loading) return (
     <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-gray-400 font-medium">Mapeando instituições...</p>
        </div>
     </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-gray-200">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
               <School size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
               Universidades
             </h1>
           </div>
          <p className="text-gray-500 font-medium ml-1">
             Gestão das {universities.length} instituições parceiras.
          </p>
        </div>
        
        <button 
           onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
           className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
        >
          <Plus size={18} /> Nova Universidade
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {universities.map((u) => (
          <div key={u.id} className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all hover:shadow-lg relative overflow-hidden flex flex-col items-center text-center">
             
             {/* Avatar / Logo Placeholder */}
             <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner text-emerald-600 font-black text-2xl tracking-tighter border border-emerald-100 group-hover:scale-105 transition-transform">
                {u.short_name?.slice(0, 2) || <School />}
             </div>

             <h3 className="text-xl font-bold text-gray-800 mb-1">{u.name}</h3>
             <span className="inline-block px-3 py-1 bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-wider rounded-lg mb-6">
                {u.short_name || 'N/A'}
             </span>
             
             {/* Action Bar (Hidden by default) */}
             <div className="mt-auto w-full pt-4 border-t border-gray-50 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                   onClick={() => { setEditingItem(u); setIsModalOpen(true); }} 
                   className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                   <Edit2 size={20} />
                </button>
                <button 
                   onClick={async () => { if(confirm('Excluir instituição?')) { await deleteUniversity(u.id); fetchData(); } }} 
                   className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                   <Trash2 size={20} />
                </button>
             </div>
          </div>
        ))}

        {universities.length === 0 && (
           <div className="col-span-full py-20 text-center text-gray-400">
              <School size={40} className="mx-auto mb-4 text-gray-200" />
              <p>Nenhuma universidade cadastrada.</p>
           </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-bold text-gray-800">
                 {editingItem ? 'Editar' : 'Nova'} Universidade
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
               </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nome da Instituição</label>
                <input name="name" required defaultValue={editingItem?.name} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300" placeholder="Ex: Universidade Eduardo Mondlane" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Sigla</label>
                <input name="shortName" required defaultValue={editingItem?.short_name} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none font-bold text-center text-lg placeholder:text-gray-300 uppercase" placeholder="UEM" />
              </div>
              
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-[2] bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:translate-y-0.5 hover:bg-emerald-700 transition-all">
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

export default AdminUniversitiesPage;
