import { useAuthStore } from '../stores/useAuthStore';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { User, Flame, Calendar, Award, Check } from 'lucide-react';
import { PREPARATION_MILESTONES } from '../types/milestone';
import { isMilestoneIrrelevant, getMilestoneDisplayData } from '../services/milestoneService';
import { updateUserProfile } from '../services/dbService.supabase';
import clsx from 'clsx';
import OptimizedImage from '../components/OptimizedImage';


const ProfilePage = () => {
  const { user, isAdmin, hasPremiumAccess } = useAuth();
  const { updateUser } = useAuthStore(); // Manter apenas para updates
  const navigate = useNavigate();

  if (!user) return null;





  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Meu Perfil</h1>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6 border-2 border-gray-100">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
          {user.photoURL ? (
            <OptimizedImage src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={48} />
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-800">{user.displayName}</h2>
          <p className="text-gray-500">Membro desde {new Date().toLocaleDateString('pt-MZ')}</p>
          <div className={clsx(
            "mt-2 inline-flex items-center px-3 py-1 rounded-full font-bold text-sm gap-2",
            isAdmin ? "bg-purple-100 text-purple-700" :
            hasPremiumAccess ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-secondary"
          )}>
            {isAdmin ? '👑 ADMINISTRADOR' : 
             hasPremiumAccess ? '⭐ MEMBRO PREMIUM' : '👤 MEMBRO GRÁTIS'}
          </div>
        </div>
<div className="flex gap-4 w-full md:w-auto justify-center md:justify-start">
           <div className="text-center">
             <div className="text-2xl font-bold text-primary">{user.streak}</div>
             <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">DIAS SEGUIDOS</div>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border-2 border-gray-100 flex items-center gap-4 transition-all hover:border-orange-200">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
            <Flame size={28} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-800">{user.streak} dias</div>
            <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Sua Sequência Atual</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border-2 border-gray-100 flex items-center gap-4 transition-all hover:border-green-200">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
            <Calendar size={28} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-800">{user.dailyExercisesCount}</div>
            <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Exercícios Hoje</div>
          </div>
        </div>
      </div>

      {/* Preparation Milestones Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="text-blue-600" />
          Marcos de Preparação
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Acompanhe sua prontidão técnica para o exame. Estes marcos indicam competência, não apenas participação.
        </p>

        <div className="space-y-4">
          {(() => {
            const stats = {
              totalQuestionsAnswered: user.dailyExercisesCount || 0,
              examsCompleted: user.examsCompleted || 0,
              simulationsCompleted: user.challengesCompleted || 0,
              averageScore: user.averageGrade || 0,
              studyPlanSubjects: user.studyPlan?.subjects || [],
              studyStreak: user.streak || 0,
              questionsPerDiscipline: user.disciplineScores || {}
            };

            return PREPARATION_MILESTONES
              .filter(m => !isMilestoneIrrelevant(m, stats))
              .map((milestone) => {
                const isAchieved = user.badges?.includes(milestone.id);
                const { name, description } = getMilestoneDisplayData(milestone, stats);
                
                return (
                  <div 
                    key={milestone.id} 
                    className={clsx(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all",
                      isAchieved 
                        ? "bg-green-50 border-green-200" 
                        : "bg-white border-gray-100 opacity-75"
                    )}
                  >
                    <div className={clsx(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                      isAchieved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                    )}>
                      {isAchieved ? <Check size={24} strokeWidth={3} /> : <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={clsx("font-bold text-base", isAchieved ? "text-gray-900" : "text-gray-600")}>
                        {name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {description}
                      </p>
                    </div>

                    {isAchieved && (
                       <span className="text-xs font-bold text-green-700 bg-white px-3 py-1 rounded-full border border-green-100 shadow-sm">
                         Concluído
                       </span>
                    )}
                  </div>
                );
              });
          })()}
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Configurações</h3>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-700">Modo Poupança de Dados</h4>
            <p className="text-sm text-gray-500">Reduza o uso de dados não carregando imagens automaticamente</p>
          </div>
          <button
            onClick={async () => {
              if (user) {
                const newStatus = !user.dataSaverMode;
                await updateUserProfile(user.uid, { dataSaverMode: newStatus });
                updateUser({ dataSaverMode: newStatus });
              }
            }}
            className={clsx(
              "w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out",
              user.dataSaverMode ? "bg-primary" : "bg-gray-300"
            )}
          >
            <div 
              className={clsx(
                "w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out",
                user.dataSaverMode ? "translate-x-6" : "translate-x-0"
              )} 
            />
          </button>
        </div>
      </div>

      {/* Study Plan Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Plano de Estudo Personalizado</h3>
          {!user.studyPlan && (
            <button 
              onClick={() => navigate('/study-plan/setup')}
              className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary-hover transition-colors"
            >
              Criar Plano
            </button>
          )}
        </div>
        
        {user.studyPlan ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-500 font-bold uppercase">Meta Diária</p>
                <p className="text-2xl font-bold text-blue-600">{user.studyPlan.dailyGoal} exercícios</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-gray-500 font-bold uppercase">Áreas de Foco</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.studyPlan.weakTopics.map(topic => (
                    <span key={topic} className="text-xs bg-white px-2 py-1 rounded-lg font-bold text-purple-600 border border-purple-100">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-gray-500 font-bold uppercase">Horário</p>
                <p className="text-sm font-medium text-green-700 mt-1">
                  {user.studyPlan.weeklySchedule.join(', ')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Você ainda não criou um plano de estudo.</p>
            <p className="text-sm">Responda a algumas perguntas para obter um horário personalizado!</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Atividade Recente</h3>
        <div className="space-y-4">
          {user.recentActivity && user.recentActivity.length > 0 ? (
            [...user.recentActivity].reverse().slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold">
                   <Check size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-700">{activity.title}</h4>
                  <p className="text-sm text-gray-400">
                    {(() => {
                      // Handle both Date objects (from standard JSON/Supabase) and Firestore Timestamps
                      const date = activity.timestamp && typeof (activity.timestamp as any).toDate === 'function' 
                        ? (activity.timestamp as any).toDate() 
                        : new Date(activity.timestamp);
                        
                      return !isNaN(date.getTime()) 
                        ? `${date.toLocaleDateString('pt-MZ')} às ${date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Data inválida';
                    })()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma atividade recente encontrada. Comece a aprender!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
