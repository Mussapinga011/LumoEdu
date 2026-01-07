import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '../stores/useContentStore';
import { ArrowRight, GraduationCap } from 'lucide-react';
import clsx from 'clsx';

const LearningPage = () => {
  const { disciplines, universities, fetchContent, loading } = useContentStore();
  const navigate = useNavigate();
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (universities.length > 0 && !selectedUniversityId) {
      setSelectedUniversityId(universities[0].id);
    }
  }, [universities, selectedUniversityId]);

  if (loading && disciplines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Agrupar disciplinas por título para que sejam universais (ex: Matemática aparece apenas uma vez)
  // Prioriza disciplinas que não tenham universityId (universais por definição)
  const uniqueDisciplines = disciplines.reduce((acc: any[], current) => {
    const existing = acc.find(item => item.title === current.title);
    if (!existing) {
      return acc.concat([current]);
    } else if (!current.universityId && existing.universityId) {
      // Se encontramos uma versão universal, substituímos a versão ligada a uma faculdade
      return acc.map(item => item.title === current.title ? current : item);
    }
    return acc;
  }, []);

  const DisciplineCard = ({ discipline }: { discipline: any }) => (
    <button 
      onClick={() => navigate(`/practice/${discipline.id}`)}
      className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 hover:border-primary hover:shadow-xl transition-all text-left group overflow-hidden flex flex-col h-full"
    >
      <div className={clsx("h-40 flex items-center justify-center text-6xl transition-transform group-hover:scale-110", discipline.color)}>
        {discipline.icon}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">{discipline.title}</h2>
          <div className="bg-primary/10 p-2 rounded-xl">
            <GraduationCap className="text-primary" size={20} />
          </div>
        </div>
        <p className="text-gray-500 font-medium text-sm mb-6 flex-1">
          Explore módulos progressivos de {discipline.title} e domine a matéria do básico ao avançado.
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-primary font-black text-xs uppercase tracking-widest">
            Iniciar Jornada
          </span>
          <div className="bg-primary text-white p-2 rounded-full group-hover:translate-x-1 transition-transform">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-gray-800 uppercase tracking-tighter">
          Modo <span className="text-primary">Aprender</span>
        </h1>
        <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">
          Cursos universais organizados por níveis. Aprenda no seu ritmo, como se estivesse jogando.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {uniqueDisciplines.length > 0 ? (
          uniqueDisciplines.map((discipline) => (
            <DisciplineCard key={discipline.id} discipline={discipline} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold uppercase tracking-widest">Nenhuma disciplina disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPage;
