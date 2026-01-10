import { useState, useEffect } from 'react';
import { getAllUniversities, saveUniversity, deleteUniversity } from '../../services/contentService.supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';

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

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-primary uppercase">MAPEANDO INSTITUIÇÕES...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-top duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter uppercase leading-none">Universidades</h1>
          <p className="text-gray-400 font-medium mt-1">Gestão das {universities.length} instituições parceiras.</p>
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-black/5 active:translate-y-1">
          <Plus size={20} /> NOVA UNI
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {universities.map((u) => (
          <div key={u.id} className="group bg-white p-10 rounded-[40px] border-2 border-transparent hover:border-primary transition-all shadow-xl text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-primary/20" />
             <div className="bg-primary/10 text-primary w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl font-black italic shadow-inner">{u.short_name?.slice(0, 2)}</div>
             <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-1">{u.name}</h3>
             <p className="text-primary font-black uppercase text-xs tracking-widest bg-primary/5 inline-block px-4 py-1.5 rounded-full">{u.short_name}</p>
             
             <div className="mt-8 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingItem(u); setIsModalOpen(true); }} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={24} /></button>
                <button onClick={async () => { if(confirm('Excluir instituição?')) { await deleteUniversity(u.id); fetchData(); } }} className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={24} /></button>
             </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm shadow-2xl border-4 border-white animate-in zoom-in-95">
            <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter leading-none">{editingItem ? 'Ajustar' : 'Nova'} Instituição</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome Completo</label>
                <input name="name" required defaultValue={editingItem?.name} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-bold placeholder:text-gray-300" placeholder="Ex: Universidade Eduardo Mondlane" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sigla</label>
                <input name="shortName" required defaultValue={editingItem?.short_name} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-black text-center text-xl" placeholder="UEM" />
              </div>
              <button type="submit" className="w-full bg-primary text-white py-5 rounded-3xl font-black shadow-lg shadow-black/5 active:translate-y-1 mt-4">CONFIRMAR INSTITUIÇÃO 🏛️</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUniversitiesPage;
