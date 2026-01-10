import { useState, useEffect } from 'react';
import { getAllDisciplines, saveDiscipline, deleteDiscipline, getAllUniversities } from '../../services/contentService.supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const AdminDisciplinesPage = () => {
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
      icon: (formData.get('icon') as string) || '',
      color: (formData.get('color') as string) || '',
      is_active: true
    };

    await saveDiscipline(item);
    setIsModalOpen(false);
    fetchData();
  };

  const filtered = disciplines.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-secondary uppercase">CATALOGANDO DISCIPLINAS...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter uppercase leading-none">Cadeiras</h1>
          <p className="text-gray-400 font-medium">Controle {disciplines.length} áreas de conhecimento.</p>
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-black hover:bg-secondary/90 transition-all shadow-lg shadow-black/5 active:translate-y-1">
          <Plus size={20} /> NOVA DISCIPLINA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((d) => (
          <div key={d.id} className="group bg-white p-8 rounded-[40px] border-2 border-transparent hover:border-secondary transition-all shadow-sm hover:shadow-2xl">
            <div className="flex justify-between items-start mb-6">
               <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl">{d.icon || '📚'}</div>
               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingItem(d); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 size={20} /></button>
                  <button onClick={async () => { if(confirm('Excluir?')) { await deleteDiscipline(d.id); fetchData(); } }} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={20} /></button>
               </div>
            </div>
            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none mb-2">{d.title}</h3>
            <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {universities.find(u => u.id === d.university_id)?.short_name || 'Geral'}
            </span>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">{editingItem ? 'Editar' : 'Nova'} Disciplina</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Título</label>
                <input name="title" required defaultValue={editingItem?.title} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary outline-none font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Universidade</label>
                <select name="universityId" defaultValue={editingItem?.university_id} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary outline-none font-bold">
                  <option value="">Geral (Todas)</option>
                  {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Emoji/Ícone</label>
                    <input name="icon" defaultValue={editingItem?.icon} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary outline-none font-bold text-center text-2xl" placeholder="📚" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Cor CSS</label>
                    <input name="color" defaultValue={editingItem?.color} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary outline-none font-bold" placeholder="#ff0000" />
                 </div>
              </div>
              <button type="submit" className="w-full bg-secondary text-white py-5 rounded-3xl font-black shadow-lg shadow-black/5 active:translate-y-1">SALVAR ✅</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisciplinesPage;
