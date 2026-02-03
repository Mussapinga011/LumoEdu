
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '../stores/useContentStore';
import { ArrowRight, GraduationCap } from 'lucide-react';
import clsx from 'clsx';


const DisciplineCard = ({ discipline }: { discipline: any }) => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(`/practice/${discipline.id}`)}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-primary hover:shadow-xl transition-all text-left group overflow-hidden flex flex-col h-full w-full relative"
    >
      <div className={clsx("h-28 flex items-center justify-center text-4xl transition-transform group-hover:scale-110 opacity-90", discipline.color)}>
        {discipline.icon}
      </div>
      <div className="p-6 flex-1 flex flex-col w-full">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">{discipline.title}</h2>
          <div className="bg-primary/10 p-2 rounded-xl">
             <GraduationCap className="text-primary" size={18} />
          </div>
        </div>
        
        <p className="text-gray-500 font-medium text-xs mb-6 flex-1 line-clamp-2">
          Acesse módulos teóricos e exercícios de {discipline.title} para fortalecer sua base.
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="font-black text-[10px] uppercase tracking-widest text-primary transition-colors">
            INICIAR
          </span>
          <div className="p-2 rounded-full bg-gray-50 group-hover:bg-primary group-hover:text-white transition-all text-gray-400">
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </button>
  );
};

const LearningPage = () => {
  const navigate = useNavigate();

  const { disciplines, fetchContent, loading } = useContentStore();

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  if (loading && disciplines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // FILTRO: Apenas disciplinas GERAIS (sem universityId)
  const generalDisciplines = disciplines.filter(d => !d.universityId);

  return (
    <div className="max-w-6xl mx-auto pb-20 pt-8 space-y-8">
      
      {/* HEADER SIMPLIFICADO */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight mb-2">
            Salas de Aula
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            Escolha uma disciplina para começar a estudar.
          </p>
        </div>
        
        {/* Atalho de volta pro Dashboard se quiser ver o plano */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-sm font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-colors md:self-center"
        >
          Ver meu Dashboard →
        </button>
      </div>

      {/* GRADE DE DISCIPLINAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {generalDisciplines.length > 0 ? (
          generalDisciplines.map((discipline: any) => (
            <DisciplineCard key={discipline.id} discipline={discipline} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold uppercase tracking-widest">Nenhuma disciplina disponível.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPage;
