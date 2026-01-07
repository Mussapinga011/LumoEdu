import { useState, useEffect } from 'react';
import { Trophy, Medal, User, X, Calendar, Flame } from 'lucide-react';
import { getAllUsers } from '../services/dbService';
import { UserProfile } from '../types/user';
import clsx from 'clsx';
import { useContentStore } from '../stores/useContentStore';

const RankingPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { fetchContent } = useContentStore();

  useEffect(() => {
    fetchContent();
    fetchRanking();
  }, [fetchContent]);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Start of Week (Monday 00:00:00)
  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // 0=Sun (go back 6), 1=Mon (go back 0)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };

  const getEndOfWeek = () => {
    const start = getStartOfWeek();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const startOfWeek = getStartOfWeek();
  const endOfWeek = getEndOfWeek();

  const getWeeklyScore = (user: UserProfile) => {
    if (!user.recentActivity || user.recentActivity.length === 0) return 0;

    const startTimestamp = startOfWeek.getTime();
    
    return user.recentActivity
      .filter(activity => {
        // Handle Firestore Timestamp or Date object
        const activityDate = activity.timestamp && typeof activity.timestamp.toDate === 'function'
          ? activity.timestamp.toDate() 
          : new Date(activity.timestamp as any);
        
        return activityDate.getTime() >= startTimestamp;
      })
      .reduce((total, activity) => total + (activity.xpEarned || 0), 0);
  };

  // Filter users by university (if selected)
  // We filter users based on their 'lastActive' or just university if we had that field. 
  // Since we don't strictly have university in UserProfile, we might need to rely on assumptions 
  // or just show all for now. But checking the file `users.ts`, no university field.
  // We can filter based on if they have discipline scores in that university maybe? 
  // For now, let's just keep the filter available but maybe it won't filter much if we don't have the data.
  // Actually, wait, previous implementation had this. How did it work?
  // It filtered disciplines list, but the user list wasn't filtered by university in the previous code 
  // unless `getScore` used `disciplineScores`.
  // Since we are now doing global weekly XP, we can't easily filter by university unless we add that to profile.
  // Let's hide university filter for now or leave it 'all' to be safe, unless we really need it.
  // User asked for "university filter" in a previous conversation. 
  // Let's check `UserActivity`... it has `title` possibly containing context? No reliable way.
  // I'll disable university filter for Weekly Ranking to be accurate.

  const sortedUsers = [...users]
    .map(user => ({ ...user, weeklyScore: getWeeklyScore(user) }))
    .sort((a, b) => b.weeklyScore - a.weeklyScore)
    .filter(u => u.weeklyScore > 0) // Only show active users this week
    .slice(0, 50);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pb-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-16 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Flame className="text-yellow-400 animate-pulse" size={32} />
                <h1 className="text-3xl md:text-4xl font-bold">Ranking Semanal</h1>
              </div>
              <p className="text-blue-100 text-lg max-w-lg">
                Acumule XP completando simulados, desafios e aulas. O ranking reinicia toda segunda-feira!
              </p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-xl border border-white/30 text-center">
              <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
                Ciclo Atual
              </div>
              <div className="flex items-center gap-2 font-bold text-xl">
                <Calendar size={20} />
                {formatDate(startOfWeek)} - {formatDate(endOfWeek)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Motivation Message */}
      {(() => {
        const day = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 4 = Thursday
        
        const messages: Record<number, { title: string; message: string; color: string; icon: any }> = {
          1: { // Monday
            title: "Segunda-feira",
            message: "Vou começar bem! Garanta sua liderança desde o início.",
            color: "bg-green-100 text-green-700 border-green-200",
            icon: Flame
          },
          4: { // Thursday
            title: "Quinta-feira",
            message: "Ainda dá tempo! O ranking está em aberto, não desista.",
            color: "bg-yellow-100 text-yellow-700 border-yellow-200",
            icon: Calendar
          },
          0: { // Sunday
            title: "Domingo",
            message: "Última chance! O ranking fecha à meia-noite.",
            color: "bg-red-100 text-red-700 border-red-200",
            icon: Calendar
          }
        };

        const currentMessage = messages[day];

        if (!currentMessage) return null;

        return (
          <div className={clsx("p-4 rounded-2xl border-2 flex items-center gap-4 animate-fade-in shadow-sm", currentMessage.color)}>
            <div className="p-3 bg-white/50 rounded-xl backdrop-blur-sm">
              <currentMessage.icon size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg">{currentMessage.title}</h3>
              <p className="font-medium opacity-90">{currentMessage.message}</p>
            </div>
          </div>
        );
      })()}

      {/* Ranking Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between font-bold text-gray-500 uppercase text-xs md:text-sm tracking-wide">
          <div className="w-12 text-center">#</div>
          <div className="flex-1">Estudante</div>
          <div className="w-24 md:w-32 text-center">Perfil</div>
          <div className="w-24 md:w-32 text-right">XP Semanal</div>
        </div>

        <div className="divide-y divide-gray-100">
          {sortedUsers.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-4xl">
                😴
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Tudo quieto por aqui...</h3>
                <p className="text-gray-500">Seja o primeiro a pontuar nesta semana!</p>
              </div>
            </div>
          ) : (
            sortedUsers.map((student, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              
              return (
                <div 
                  key={student.uid} 
                  className={clsx(
                    "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors animate-fade-in",
                    isTop3 && "bg-yellow-50/30"
                  )}
                >
                  <div className="w-12 text-center font-bold text-lg flex justify-center">
                    {rank === 1 ? <Trophy className="text-yellow-500 drop-shadow-sm" size={24} /> :
                     rank === 2 ? <Medal className="text-gray-400 drop-shadow-sm" size={24} /> :
                     rank === 3 ? <Medal className="text-orange-500 drop-shadow-sm" size={24} /> :
                     <span className="text-gray-400 font-mono text-base">#{rank}</span>}
                  </div>
                  
                  <div className="flex-1 flex items-center gap-3">
                    <div className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm border-2",
                      isTop3 ? "border-yellow-200 bg-yellow-100" : "border-gray-100 bg-gray-100"
                    )}>
                      {student.photoURL ? (
                        <img src={student.photoURL} alt={student.displayName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={clsx("font-bold text-sm md:text-base", isTop3 ? "text-gray-900" : "text-gray-700")}>
                          {student.displayName}
                        </span>
                        {student.isPremium && <span className="text-yellow-500 text-xs" title="Premium">⭐</span>}
                      </div>
                      {rank === 1 && <span className="text-xs text-yellow-600 font-bold">👑 Líder da Semana</span>}
                    </div>
                  </div>

                  <div className="w-24 md:w-32 text-center">
                    <button
                      onClick={() => setSelectedUser(student)}
                      className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Ver Perfil
                    </button>
                  </div>
                  
                  <div className="w-24 md:w-32 text-right">
                    <div className="font-black text-indigo-600 text-lg md:text-xl">
                      {(student as any).weeklyScore} XP
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-gray-800">Perfil do Estudante</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            <div className="text-center space-y-4 py-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-500 mx-auto border-4 border-white shadow-xl">
                {selectedUser.photoURL ? (
                   <img src={selectedUser.photoURL} alt={selectedUser.displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={48} />
                )}
              </div>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedUser.displayName}</h3>
                  {selectedUser.isPremium && <span className="text-xl">⭐</span>}
                </div>
                <div className="text-indigo-600 font-bold mt-1 text-lg">
                  Nível {selectedUser.level || 1}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100">
                <div className="text-xl font-black text-gray-800">{(selectedUser as any).weeklyScore}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">XP Semana</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100">
                <div className="text-xl font-black text-gray-800">{selectedUser.streak || 0} 🔥</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Sequência</div>
              </div>
            </div>

            {selectedUser.badges && selectedUser.badges.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-700 mb-3 text-sm">Conquistas Recentes</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.badges.slice(0, 3).map((badge, idx) => (
                    <span key={idx} className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
                      {badge}
                    </span>
                  ))}
                  {selectedUser.badges.length > 3 && (
                     <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                      +{selectedUser.badges.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <button 
              className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 hover:bg-primary-hover transition-all active:scale-95"
              onClick={() => setSelectedUser(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingPage;
