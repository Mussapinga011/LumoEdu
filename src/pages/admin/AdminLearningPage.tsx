import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '../../stores/useContentStore';
import { BookOpen, ArrowRight, Settings } from 'lucide-react';

const AdminLearningPage = () => {
  const navigate = useNavigate();
  const { disciplines, fetchContent, loading } = useContentStore();

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-primary">MAPA DE CONHECIMENTO...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter uppercase leading-none">Learning Hub</h1>
          <p className="text-gray-400 font-medium mt-2">Selecione uma disciplina para gerenciar as trilhas de aprendizado.</p>
        </div>
        <div className="bg-primary/10 p-5 rounded-3xl text-primary"><BookOpen size={48} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disciplines.map((d) => (
          <button
            key={d.id}
            onClick={() => navigate(`/admin/learning/sessions/${d.id}`)}
            className="group relative bg-white p-8 rounded-[32px] border-2 border-transparent hover:border-primary transition-all shadow-xl hover:shadow-2xl hover:-translate-y-2 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8 grayscale group-hover:grayscale-0 transition-all" />
            
            <div className="relative z-10">
              <div className="bg-primary/10 text-primary w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                <Settings size={28} />
              </div>
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none mb-2">{d.title}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{d.universityName || 'Geral'}</p>
              
              <div className="mt-8 flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                Gerenciar Trilha <ArrowRight size={16} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminLearningPage;
