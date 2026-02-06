import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '../../stores/useContentStore';
import { BookOpen, ArrowRight, Sparkles, GraduationCap, BookText } from 'lucide-react';

const AdminLearningPage = () => {
  const navigate = useNavigate();
  const { disciplines, fetchContent, loading } = useContentStore();

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // FILTRO SIMPLES: Apenas disciplinas GERAIS (sem university_id)
  const generalDisciplines = disciplines.filter(d => !d.universityId);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Carregando mapa de conhecimento...</p>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 p-6 md:p-8 rounded-[2rem] text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-primary-light text-[10px] font-black uppercase tracking-[0.15em] mb-3 border border-white/10">
            <GraduationCap size={12} /> Engenharia de Conteúdo
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-3 leading-none uppercase italic">
            MODO <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent italic">APRENDER</span>
          </h1>
          <p className="text-blue-100/70 font-medium max-w-md text-sm italic">
            Gerencie as trilhas de aprendizado e o mapa de conhecimento das disciplinas gerais.
          </p>
        </div>
      </div>

      {/* Grid de Disciplinas GERAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {generalDisciplines.map((d) => (
          <div
            key={d.id}
            className="group relative bg-white p-5 rounded-2xl border border-gray-100 hover:border-primary/30 transition-all hover:shadow-lg text-left overflow-hidden"
          >
            {/* Decorative Element */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <BookOpen size={20} />
                </div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
                  Geral
                </span>
              </div>
              
              <h3 className="text-lg font-black text-gray-800 mb-1 leading-tight uppercase tracking-tighter">{d.title}</h3>
              
              <div className="mt-5 flex flex-col gap-2">
                <button 
                  onClick={() => navigate(`/admin/learning/${d.id}/sections`)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs hover:bg-primary hover:text-white transition-all group/btn uppercase tracking-tighter"
                >
                  Gerenciar Trilha
                  <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={() => navigate(`/admin/learning/${d.id}/syllabus`)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 text-gray-500 rounded-xl font-black text-xs hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 uppercase tracking-tighter"
                >
                  Regras do Edital
                  <BookText size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {generalDisciplines.length === 0 && (
           <div className="col-span-full py-20 text-center text-gray-400">
              <Sparkles size={40} className="mx-auto mb-4 text-gray-200" />
              <p className="font-medium">Nenhuma disciplina geral cadastrada.</p>
              <p className="text-sm text-gray-300 mt-2">Crie disciplinas sem universidade específica para usar no Modo Aprender.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminLearningPage;
