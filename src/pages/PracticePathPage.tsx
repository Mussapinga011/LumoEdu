import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { getSessionsByDiscipline, getUserProgressByDiscipline } from '../services/practiceService';
import { PracticeSession, UserSessionProgress } from '../types/practice';
import { Star, Trophy, Gift, ArrowLeft, BookOpen, Lock } from 'lucide-react';
import clsx from 'clsx';

const PracticePathPage = () => {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [progress, setProgress] = useState<Record<string, UserSessionProgress>>({});
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    if (!user || !disciplineId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [sessionsData, progressData] = await Promise.all([
          getSessionsByDiscipline(disciplineId),
          getUserProgressByDiscipline(user.uid, disciplineId)
        ]);
        setSessions(sessionsData);
        setProgress(progressData);
      } catch (error) {
        console.error('Error fetching practice data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, disciplineId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Define position offsets for the snake effect
  const getOffset = (index: number) => {
    const pattern = [0, 40, 60, 40, 0, -40, -60, -40];
    return pattern[index % pattern.length];
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/disciplines')} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Caminho de Aprendizado</h1>
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Unidade 1 • Introdução</p>
        </div>
        <button className="ml-auto bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          <BookOpen size={20} />
          GUIA
        </button>
      </div>

      {/* Snake Path */}
      <div className="max-w-md mx-auto mt-8 px-4 flex flex-col items-center gap-8 relative">
        {sessions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 w-full">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-xl font-bold text-gray-800">Em Construção</h2>
            <p className="text-gray-500">Ainda não há módulos para esta disciplina.</p>
          </div>
        ) : (
          sessions.map((session, index) => {
            const isCompleted = progress[session.id]?.completed;
            const isAvailable = index === 0 || progress[sessions[index-1].id]?.completed;
            const offset = getOffset(index);
            
            return (
              <div 
                key={session.id} 
                className="relative flex flex-col items-center group"
                style={{ transform: `translateX(${offset}px)` }}
              >
                {/* Floating "Começar" tag */}
                {/* Mascot & Floating Action */}
                {isAvailable && !isCompleted && (
                  <div className="absolute -top-20 -right-24 z-20 flex flex-col items-start animate-bounce-subtle pointer-events-none">
                     {/* Speech Bubble */}
                     <div className="bg-white border-2 border-gray-200 px-4 py-2 rounded-xl rounded-bl-none shadow-md mb-1 relative transform -translate-x-4">
                        <span className="font-black text-gray-700 text-sm whitespace-nowrap uppercase tracking-wide text-primary">Vamos lá!</span>
                     </div>
                     {/* Mascot Image */}
                     <img src="/lumo_mascot.png" className="w-24 h-24 object-contain drop-shadow-xl transform -scale-x-100" alt="Mascote" />
                  </div>
                )}

                {/* Node */}
                <button
                  disabled={!isAvailable}
                  onClick={() => {
                    if (isAvailable) {
                      if (!user?.isPremium && index >= 3) {
                         setShowPremiumModal(true);
                      } else {
                         navigate(`/practice/${disciplineId}/session/${session.id}`);
                      }
                    }
                  }}
                  className={clsx(
                    "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-[0_8px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-2",
                    isCompleted 
                      ? "bg-green-500 hover:bg-green-400" 
                      : isAvailable 
                        ? (!user?.isPremium && index >= 3)
                          ? "bg-gray-800 hover:bg-gray-700" // Premium Locked Color
                          : "bg-primary hover:bg-primary-hover"
                        : "bg-gray-300 cursor-not-allowed"
                  )}
                >
                  {(!user?.isPremium && index >= 3) ? (
                     <Lock size={32} className="text-yellow-400" />
                  ) : index % 3 === 2 ? (
                    <Gift size={32} className="text-white" />
                  ) : index % 5 === 0 ? (
                    <Trophy size={32} className="text-white" />
                  ) : (
                    <Star size={32} className={clsx("text-white", isCompleted && "fill-white")} />
                  )}
                </button>

                {/* Label (Mobile only or tooltip) */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p className={clsx(
                    "text-sm font-bold uppercase",
                    isAvailable ? "text-gray-700" : "text-gray-400"
                  )}>
                    {session.title}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Premium Trigger Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center transform transition-all scale-100 shadow-2xl">
             <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={40} className="text-yellow-600" />
             </div>
             <h2 className="text-2xl font-black text-gray-800 mb-2">Sessão Bloqueada</h2>
             <p className="text-gray-600 font-medium mb-6 leading-relaxed">
               Você já avançou muito 👏 <br/>
               As próximas sessões são para quem quer <span className="text-primary font-bold">dominar a prova</span>.
             </p>
             
             <button 
               onClick={() => {
                 // Open Upgrade Page or Stripe Integration (placeholder)
                 alert("Redirecionando para página de planos...");
                 setShowPremiumModal(false);
               }}
               className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black py-4 rounded-xl shadow-lg shadow-orange-200 mb-3 hover:scale-105 transition-transform"
             >
               DESBLOQUEAR TUDO
             </button>
             
             <button 
               onClick={() => setShowPremiumModal(false)}
               className="text-gray-400 font-bold text-sm uppercase hover:text-gray-600"
             >
               Agora não
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticePathPage;
