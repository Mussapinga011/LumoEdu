import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSectionsByDiscipline, getUserProgressByDiscipline, getSessionsBySection } from '../services/practiceService.supabase';
import { getAllDisciplines } from '../services/contentService.supabase';
import { PracticeSection } from '../types/practice';
import { Discipline } from '../types/discipline';
import { ArrowLeft, Lock, Star, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../stores/useAuthStore';

// Temporary Mascot Component (Placeholder for the owl)
const Mascot = ({ message }: { message: string }) => (
  <div className="flex items-start gap-4 animate-fade-in transition-all hover:scale-105">
    <div className="relative">
      <div className="w-24 h-24 bg-transparent flex items-center justify-center">
        <img src="/lumo_mascot_Insentivador.png" alt="Lumo Mascote" className="w-full h-full object-contain filter drop-shadow-lg" />
      </div>
    </div>
    <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 relative max-w-[200px] shadow-sm transform -rotate-1">
      <div className="absolute top-8 -left-2 w-4 h-4 bg-white border-l-2 border-b-2 border-gray-100 rotate-45"></div>
      <p className="font-bold text-gray-700 text-sm">{message}</p>
    </div>
  </div>
);

const SectionCard = ({ 
  section, 
  progress, 
  isLocked, 
  onContinue,
  index
}: { 
  section: PracticeSection, 
  progress: number, 
  isLocked: boolean, 
  onContinue: () => void,
  index: number
}) => {
  return (
    <div className="mb-6 relative">
      {/* Section Header with "Jump to" logic if needed */}
      <div className={clsx(
        "rounded-3xl border-2 transition-all overflow-hidden bg-white mb-2",
        isLocked ? "border-gray-200" : "border-gray-200 hover:border-primary shadow-sm"
      )}>
        {/* Header Color Strip */}
        <div className={clsx(
          "h-3 w-full",
          isLocked ? "bg-gray-100" : index % 2 === 0 ? "bg-primary" : "bg-purple-500" // Alternating colors
        )}></div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className={clsx("text-xs font-black uppercase tracking-widest mb-1", isLocked ? "text-gray-400" : "text-primary")}>
                Sessão {index + 1}
              </h3>
              <h2 className={clsx("text-xl font-black", isLocked ? "text-gray-400" : "text-gray-800")}>
                {section.title}
              </h2>
              <p className="text-sm text-gray-400 font-medium mt-1">{section.description}</p>
            </div>
          </div>

          {!isLocked ? (
            <div className="space-y-4">
               {/* Progress Bar */}
               <div className="flex items-center gap-3">
                 <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-green-500 rounded-full transition-all duration-1000"
                     style={{ width: `${progress}%` }}
                   />
                 </div>
                 <span className="text-xs font-black text-green-600">{Math.round(progress)}%</span>
                 <div className="bg-yellow-100 p-1 rounded-lg">
                    <Star size={16} className="text-yellow-600 fill-yellow-600" />
                 </div>
               </div>

              <button
                onClick={onContinue}
                className="w-full py-3 bg-primary text-white font-black rounded-xl uppercase tracking-widest shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
              >
                {progress > 0 ? 'Continuar' : 'Começar'} <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between">
               <div className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                 <Lock size={16} /> <span>Bloqueado</span>
               </div>
               <button 
                 disabled 
                 className="px-6 py-2 border-2 border-gray-200 text-gray-300 font-bold rounded-xl uppercase tracking-widest text-xs cursor-not-allowed"
               >
                 Pular para cá
               </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mascot appearance logic (random or first unlocked) */}
      {!isLocked && index === 0 && (
         <div className="absolute -top-6 -right-2 md:-right-12 z-10 hidden md:block">
            <Mascot message="Vamos começar com o básico!" />
         </div>
      )}
       {!isLocked && index === 1 && (
         <div className="absolute -top-6 -right-2 md:-right-12 z-10 hidden md:block">
            <Mascot message="Você está indo muito bem!" />
         </div>
      )}
    </div>
  );
};

const PracticeSectionsPage = () => {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [sections, setSections] = useState<PracticeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({}); // Map sectionId -> percentage

  useEffect(() => {
    if (disciplineId && user) {
      loadData();
    }
  }, [disciplineId, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get Discipline Info from Store (already fetched or fetch if needed)
      // Since useContentStore is already standard, we can use it, but for simplicity here:
      const discs = await getAllDisciplines();
      const disc = discs.find(d => d.id === disciplineId);
      if (disc) {
        setDiscipline({
          id: disc.id,
          title: disc.title,
          icon: disc.icon,
          color: disc.color,
          isActive: disc.is_active
        } as any);
      }

      // 2. Fetch All Sections
      const fetchedSections = await getSectionsByDiscipline(disciplineId!);
      
      // If no sections exist, creates a default one (legacy handling logic could act here, but let's assume admin created sections)
      // If fetchedSections is empty, we might want to redirect or show empty state
      setSections(fetchedSections);

      // 3. Calculate Progress per Section
      // We need user progress + total sessions per section
      // This is efficient? Maybe not for MANY sections.
      // Optimization: Fetch all user progress for discipline ONCE.
      const userProgressMap = await getUserProgressByDiscipline(user!.uid, disciplineId!);
      
      const newSectionProgress: Record<string, number> = {};
      
      await Promise.all(fetchedSections.map(async (sec) => {
        const sessions = await getSessionsBySection(disciplineId!, sec.id);
        const total = sessions.length;
        if (total === 0) {
           newSectionProgress[sec.id] = 0;
           return;
        }
        
        // Count completed sessions in this section
        const completed = sessions.filter(s => userProgressMap[s.id]?.completed).length;
        newSectionProgress[sec.id] = (completed / total) * 100;
      }));

      setSectionProgress(newSectionProgress);

    } catch (error) {
      console.error("Error loading sections page:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
     </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-3 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate('/learning')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <span className="font-black text-gray-400 text-sm uppercase tracking-widest">
          {discipline?.title || 'Disciplina'}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {sections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-bold">Nenhuma seção encontrada.</p>
            <p className="text-sm text-gray-400 mt-2">O conteúdo está sendo criado.</p>
          </div>
        ) : (
          <div className="space-y-4">
             {sections.map((section, index) => {
               // Unlock Logic: Section N is unlocked if Section N-1 is completed (100%) OR if it's the first one
               // For now, let's say unlock if previous has SOME progress? No, usually it's strict.
               // Let's make it simple: Unlock if previous > 0? Or completed?
               // Strict Duolingo style: Must complete previous Unit to unlock next.
               // My calculation of 'progress' is percentage.
               
               let isLocked = false;
               // Lógica de desbloqueio removida para permitir acesso livre
               // if (index > 0) { ... }

               return (
                 <SectionCard 
                   key={section.id}
                   index={index}
                   section={section}
                   progress={sectionProgress[section.id] || 0}
                   isLocked={isLocked}
                   onContinue={() => navigate(`/practice/${disciplineId}/section/${section.id}`)}
                 />
               );
             })}
          </div>
        )}
      </div>

      {/* Floating Bottom Action if needed */}
    </div>
  );
};

export default PracticeSectionsPage;
