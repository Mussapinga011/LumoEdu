import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { getSessionsByDiscipline, getUserProgressByDiscipline, getSectionsByDiscipline, getSessionsBySection } from '../services/practiceService';
import { PracticeSession, UserSessionProgress, PracticeSection } from '../types/practice';
import { Star, Trophy, ArrowLeft, BookOpen, Lock } from 'lucide-react';
import clsx from 'clsx';

const PracticePathPage = () => {
  const { disciplineId, sectionId } = useParams<{ disciplineId: string; sectionId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const currentLevelRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [section, setSection] = useState<PracticeSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, UserSessionProgress>>({});
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    if (disciplineId && user) {
      loadData();
    }
  }, [disciplineId, sectionId, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch User Progress
      const userProg = await getUserProgressByDiscipline(user!.uid, disciplineId!);
      setProgress(userProg);

      // 2. Fetch Content
      if (sectionId) {
        // New Mode: Single Section
        const [sectSessions, allSections] = await Promise.all([
           getSessionsBySection(disciplineId!, sectionId),
           getSectionsByDiscipline(disciplineId!)
        ]);
        setSessions(sectSessions);
        const currentSection = allSections.find(s => s.id === sectionId);
        setSection(currentSection || null);
      } else {
        // Legacy Mode: Fetch all sessions (fallback)
        // Ideally we should redirect to Sections Page if no sectionId, but let's keep it safe
        const allSessions = await getSessionsByDiscipline(disciplineId!);
        setSessions(allSessions);
      }

    } catch (error) {
      console.error("Error loading path:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to current level after loading
    if (!loading && currentLevelRef.current) {
      setTimeout(() => {
        currentLevelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [loading]);

  // Define position offsets for the snake effect
  const getOffset = (index: number) => {
    const pattern = [0, 40, 60, 40, 0, -40, -60, -40];
    return pattern[index % pattern.length];
  };

  // Determine global completion status to unlock next items
  // Logic simplified: index 0 is always unlocked.
  // Index N is unlocked if N-1 is COMPLETED.
  const getUnlockStatus = (index: number) => {
      if (index === 0) return true;
      const prevSession = sessions[index - 1];
      // Check if previous session is completed in user progress
      return !!progress[prevSession.id]?.completed;
  };

  if (loading) return (
     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
     </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Stick Header (Green as per image) */}
      <div className="bg-[#58CC02] border-b border-[#46a302] sticky top-0 z-30 px-4 py-4 flex items-center justify-between shadow-md text-white">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => navigate(`/practice/${disciplineId}`)} 
             className="p-1 hover:bg-white/20 rounded-lg transition-colors"
           >
             <ArrowLeft size={24} className="text-white" />
           </button>
           <div>
             <h2 className="font-black text-xs uppercase tracking-widest text-green-100 opacity-80">
                {section?.title || 'Trilha de Aprendizado'}
             </h2>
             <h1 className="font-bold text-lg leading-tight">
                {section?.description || 'Vamos aprender!'}
             </h1>
           </div>
        </div>
        <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
           <BookOpen size={16} /> Guia
        </button>
      </div>

      <div className="max-w-md mx-auto relative pt-12 pb-20 px-4">
          
        {/* Snake Path */}
        <div className="flex flex-col items-center gap-6">
          {sessions.map((session, index) => {
            const isCompleted = progress[session.id]?.completed;
            const isUnlocked = getUnlockStatus(index);
            const isCurrent = isUnlocked && !isCompleted;
            
            // Snake offset
            const offset = getOffset(index);

            return (
              <div 
                key={session.id} 
                className="relative flex flex-col items-center group mb-4"
                style={{ transform: `translateX(${offset}px)` }}
                ref={isCurrent ? currentLevelRef : null}
              >
                {/* Floating "Start" tooltip for current item */}
                {isCurrent && (
                  <div className="absolute -top-12 animate-bounce z-20">
                     <div className="bg-white text-primary font-bold text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md border-b-4 border-gray-100">
                        Começar
                     </div>
                     <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white mx-auto"></div>
                  </div>
                )}

                {/* The Node Button */}
                <div className="relative">
                  <button
                    disabled={!isUnlocked}
                    onClick={() => {
                      if (isUnlocked) {
                          // Navigate to quiz with explicit sectionId if available
                          if (sectionId) {
                             navigate(`/practice/${disciplineId}/section/${sectionId}/session/${session.id}`);
                          } else {
                             navigate(`/practice/${disciplineId}/session/${session.id}`);
                          }
                      }
                    }}
                    className={clsx(
                      "relative w-20 h-20 rounded-full flex items-center justify-center transition-all z-10",
                      // 3D Effect logic: border-b-4 or box-shadow
                      "shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[6px]",
                      isCompleted
                          ? "bg-yellow-400 shadow-yellow-600" 
                          : isCurrent
                            ? "bg-[#58CC02] shadow-[#46a302] ring-4 ring-green-100" 
                            : "bg-[#e5e5e5] shadow-[#cecece] text-[#afafaf] cursor-not-allowed" 
                    )}
                  >
                    {isCompleted ? (
                       <Star size={32} className="text-white fill-white" />
                    ) : isCurrent ? (
                       <Star size={32} className="text-white fill-white animate-pulse" />
                    ) : (
                       <Lock size={28} />
                    )}
                  </button>
                </div>
                
                {/* Mascot (Lumo Guia) next to current element */}
                {isCurrent && (
                   <div className="absolute top-1/2 -translate-y-1/2 left-24 w-24 h-24 animate-fade-in z-0 pointer-events-none">
                      <img src="/lumo_mascot_Guia.png" alt="Lumo Guia" className="w-full h-full object-contain animate-bounce" />
                   </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* End Path */}
        <div className="text-center mt-12">
            <Trophy size={40} className="text-yellow-600 mx-auto mb-2 opacity-50" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Fim da Unidade</p>
        </div>

      </div>

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
             <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-yellow-600" />
             </div>
             <h2 className="text-xl font-black text-gray-800 mb-2">Conteúdo Exclusivo</h2>
             <p className="text-gray-600 text-sm font-medium mb-6">
               Desbloqueie todas as etapas e acelere sua aprovação.
             </p>
             <button 
               onClick={() => setShowPremiumModal(false)}
               className="w-full bg-primary text-white font-bold py-3 rounded-xl mb-3"
             >
               Virar Premium
             </button>
             <button 
               onClick={() => setShowPremiumModal(false)}
               className="text-gray-400 font-bold text-xs uppercase"
             >
               Talvez depois
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticePathPage;
