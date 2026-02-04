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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-gray-200">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
               <GraduationCap size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
               Modo Aprender
             </h1>
           </div>
          <p className="text-gray-500 font-medium ml-1">
             Gerencie as trilhas de aprendizado das disciplinas gerais.
          </p>
        </div>
      </div>

      {/* Grid de Disciplinas GERAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {generalDisciplines.map((d) => (
          <div
            key={d.id}
            className="group relative bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all hover:shadow-lg text-left overflow-hidden"
          >
            {/* Decorative Element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                 <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   <BookOpen size={24} />
                 </div>
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg">
                    Geral
                 </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-1">{d.title}</h3>
              
              <div className="mt-6 flex flex-col gap-3">
                <button 
                  onClick={() => navigate(`/admin/learning/${d.id}/sections`)}
                  className="w-full flex items-center justify-between p-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all group/btn"
                >
                  Gerenciar Trilha
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={() => navigate(`/admin/learning/${d.id}/syllabus`)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                >
                  Regras do Edital (Topics)
                  <BookText size={16} />
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
