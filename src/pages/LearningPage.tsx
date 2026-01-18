import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '../stores/useContentStore';
import { useAuthStore } from '../stores/useAuthStore';
import { ArrowRight, GraduationCap, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { SyllabusCoverageCard } from '../components/SyllabusCoverageCard';
import { translateDiscipline } from '../utils/formatters';

const DisciplineCard = ({ discipline }: { discipline: any }) => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(`/practice/${discipline.id}`)}
      className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 hover:border-primary hover:shadow-xl transition-all text-left group overflow-hidden flex flex-col h-full w-full"
    >
      <div className={clsx("h-32 flex items-center justify-center text-5xl transition-transform group-hover:scale-110", discipline.color)}>
        {discipline.icon}
      </div>
      <div className="p-6 flex-1 flex flex-col w-full">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">{discipline.title}</h2>
          <div className="bg-primary/10 p-2 rounded-xl">
             <GraduationCap className="text-primary" size={20} />
          </div>
        </div>
        
        <p className="text-gray-500 font-medium text-xs mb-6 flex-1">
          Domine a matéria do básico ao avançado em módulos interativos.
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="font-black text-xs uppercase tracking-widest text-primary transition-colors">
            INICIAR JORNADA
          </span>
          <div className="p-2 rounded-full bg-primary shadow-blue-200 group-hover:translate-x-1 transition-all text-white">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </button>
  );
};

const LearningPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { disciplines, universities, fetchContent, loading } = useContentStore();
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

  // Agrupar disciplinas por título para que sejam universais
  const uniqueDisciplines = disciplines.reduce((acc: any[], current) => {
    const existing = acc.find(item => item.title === current.title);
    if (!existing) {
      return acc.concat([current]);
    } else if (!current.universityId && existing.universityId) {
      return acc.map(item => item.title === current.title ? current : item);
    }
    return acc;
  }, []);

  // Determine today's study plan
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }); // e.g., "segunda-feira"
  const formattedToday = today.charAt(0).toUpperCase() + today.slice(1).split('-')[0]; // "Segunda"

  const isStudyDay = user?.studyPlan?.weeklySchedule?.some((day: string) => day.includes(formattedToday));
  const dailyGoal = user?.studyPlan?.dailyGoal || 10;
  const progress = Math.min(((user?.dailyExercisesCount || 0) / dailyGoal) * 100, 100);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      
      {/* 1. HERO / DASHBOARD SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Welcome & Daily Progress */}
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-950 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full -translate-y-32 translate-x-16 blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full translate-y-20 -translate-x-10 blur-[60px] pointer-events-none" />
              
              <div className="relative z-10">
                  <h1 className="text-3xl font-black mb-1 leading-tight tracking-tight">
                      {user?.displayName?.split(' ')[0] || 'Futuro Universitário'} 🎓
                  </h1>
                  <p className="text-blue-200 text-sm mb-8 font-medium max-w-md opacity-90">
                      {progress >= 100 
                        ? "Excelente! Meta diária atingida. Sua consistência é a chave para a vaga! 🚀"
                        : "Cada questão resolvida é um passo a mais rumo à aprovação."}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300/80">Progresso do Dia</span>
                          <span className="font-black text-2xl">{user?.dailyExercisesCount || 0} <span className="text-xs font-medium text-blue-300/60 uppercase">/ {dailyGoal} questões</span></span>
                      </div>
                      <div className="h-4 bg-white/10 rounded-full p-1 border border-white/5 backdrop-blur-sm">
                          <div 
                              className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(103,232,249,0.3)]" 
                              style={{ width: `${progress}%` }} 
                          />
                      </div>
                    </div>

                    {user?.studyPlan && (
                      <div className="flex gap-4 border-l border-white/10 pl-8">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300/80 mb-1">Universidade Alvo</p>
                          <p className="font-bold text-lg">{user.studyPlan.targetUniversity || 'UEM'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300/80 mb-1">Curso Alvo</p>
                          <p className="font-bold text-lg truncate max-w-[120px]">{user.studyPlan.targetCourse || 'Geral'}</p>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
          </div>
      </div>

      {/* 2. SYLLABUS & FOCUS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SyllabusCoverageCard 
              userId={user?.id || ''} 
              targetDisciplineIds={user?.studyPlan?.subjects || []} 
            />
          </div>

          {/* Today's Focus & Weekly Schedule */}
          <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 flex flex-col shadow-xl relative overflow-hidden group hover:border-indigo-200 transition-all duration-300">
              <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest">
                        <Calendar size={14} />
                        <span>{formattedToday}-feira</span>
                    </div>
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                      isStudyDay ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {isStudyDay ? "Dia de Foco" : "Descanso"}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-800 mb-2 leading-tight">
                      {isStudyDay ? "Sua meta de hoje" : "Revise o básico"}
                  </h3>
                  
                  {user?.studyPlan ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {user.studyPlan.subjects?.map((sub: string) => (
                           <span key={sub} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                              {translateDiscipline(sub)}
                           </span>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sua Semana:</p>
                        <div className="flex justify-between gap-1">
                          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => {
                            const daysMap = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
                            const hasStudy = user.studyPlan?.weeklySchedule?.some((d: string) => d.includes(daysMap[i]));
                            return (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <div className={clsx(
                                  "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all",
                                  hasStudy ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-gray-50 text-gray-300"
                                )}>
                                  {day}
                                </div>
                                {formattedToday === daysMap[i] && <div className="w-1 h-1 bg-indigo-600 rounded-full" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button 
                        onClick={() => navigate('/study-plan/setup')}
                        className="mt-2 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
                    >
                        Configurar Meu Plano
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
              </div>
          </div>
      </div>

      <div className="space-y-6">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
              Disciplinas
            </h2>
            <p className="text-gray-500 font-medium">
              Escolha uma matéria para praticar
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
    </div>
  );
};

export default LearningPage;
