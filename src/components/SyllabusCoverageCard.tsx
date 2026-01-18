import { useState, useEffect } from 'react';
import { getSyllabusCoverage, DisciplineCoverage } from '../services/syllabusService';
import { BookOpen } from 'lucide-react';
import clsx from 'clsx';
import { translateDiscipline } from '../utils/formatters';

interface SyllabusCoverageCardProps {
  userId: string;
  targetDisciplineIds: string[];
}

export const SyllabusCoverageCard = ({ userId, targetDisciplineIds }: SyllabusCoverageCardProps) => {
  const [coverage, setCoverage] = useState<DisciplineCoverage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoverage = async () => {
      const data = await getSyllabusCoverage(userId, targetDisciplineIds);
      setCoverage(data);
      setLoading(false);
    };
    fetchCoverage();
  }, [userId, targetDisciplineIds]);

  if (loading) return (
    <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm animate-pulse h-48" />
  );

  if (coverage.length === 0) return null;

  return (
    <div className="bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-xl overflow-hidden relative group transition-all hover:border-indigo-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-gray-800 tracking-tight">Cobertura do Edital</h3>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-[0.1em] mt-1">Domínio dos tópicos do currículo oficial</p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <BookOpen size={24} />
        </div>
      </div>

      <div className="space-y-6">
        {coverage.map((discipline) => (
          <div key={discipline.disciplineId}>
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-gray-700 text-sm">
                {translateDiscipline(discipline.disciplineTitle)}
              </span>
              <span className="font-black text-indigo-600 text-sm">{discipline.percentage}%</span>
            </div>
            
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
              <div 
                className={clsx(
                  "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                  discipline.percentage >= 80 ? "bg-green-500" : 
                  discipline.percentage >= 50 ? "bg-indigo-500" : "bg-blue-400"
                )}
                style={{ width: `${discipline.percentage}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-1">
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                 {discipline.completedTopics} de {discipline.totalTopics} tópicos
               </span>
               {discipline.percentage >= 100 && (
                 <span className="text-[10px] text-green-600 font-black uppercase tracking-widest">Completo</span>
               )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-50">
        <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic text-center">
          "A aprovação é construída um tópico de cada vez. Mantenha o foco!"
        </p>
      </div>
    </div>
  );
};
