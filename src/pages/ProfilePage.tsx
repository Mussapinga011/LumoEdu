import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { User, Trophy, Flame, Star, Calendar, Award } from 'lucide-react';
import { BADGES } from '../services/badgeService';
import { updateUserProfile } from '../services/dbService';
import clsx from 'clsx';
import OptimizedImage from '../components/OptimizedImage';


const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
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
          <p className="text-gray-500">Membro desde {new Date().toLocaleDateString('pt-PT')}</p>
          <div className={clsx(
            "mt-2 inline-flex items-center px-3 py-1 rounded-full font-bold text-sm",
            user.isPremium ? "bg-green-100 text-green-700" : "bg-blue-100 text-primary"
          )}>
            {user.isPremium ? '⭐ MEMBRO PREMIUM' : '👤 MEMBRO GRÁTIS'}
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto justify-center md:justify-start">
           <div className="text-center">
             <div className="text-2xl font-bold text-accent">{user.level}</div>
             <div className="text-xs text-gray-500 font-bold uppercase">Nível</div>
           </div>
           <div className="text-center">
             <div className="text-2xl font-bold text-primary">{user.xp}</div>
             <div className="text-xs text-gray-500 font-bold uppercase">XP Total</div>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-3 md:p-4 rounded-xl border-2 border-gray-100 flex flex-col items-center gap-2">
          <Flame className="text-orange-500" size={24} />
          <div className="text-lg md:text-xl font-bold">{user.streak}</div>
          <div className="text-[10px] md:text-xs text-gray-400 font-bold uppercase text-center">Sequência</div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-xl border-2 border-gray-100 flex flex-col items-center gap-2">
          <Star className="text-yellow-500" size={24} />
          <div className="text-lg md:text-xl font-bold">{user.xp}</div>
          <div className="text-[10px] md:text-xs text-gray-400 font-bold uppercase text-center">Total XP</div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-xl border-2 border-gray-100 flex flex-col items-center gap-2">
          <Trophy className="text-blue-500" size={24} />
          <div className="text-lg md:text-xl font-bold">Top 10%</div>
          <div className="text-[10px] md:text-xs text-gray-400 font-bold uppercase text-center">Liga</div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-xl border-2 border-gray-100 flex flex-col items-center gap-2">
          <Calendar className="text-green-500" size={24} />
          <div className="text-lg md:text-xl font-bold">{user.dailyExercisesCount}</div>
          <div className="text-[10px] md:text-xs text-gray-400 font-bold uppercase text-center">Exercícios Hoje</div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="text-yellow-500" />
          Conquistas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BADGES.map((badge) => {
            const isUnlocked = user.badges?.includes(badge.id);
            const Icon = badge.icon;
            
            return (
              <div 
                key={badge.id} 
                className={`p-4 rounded-xl border-2 flex flex-col items-center text-center gap-2 transition-all ${
                  isUnlocked 
                    ? 'bg-white border-yellow-100 shadow-sm' 
                    : 'bg-gray-50 border-gray-100 opacity-60 grayscale'
                }`}
              >
                <div className={`p-3 rounded-full ${isUnlocked ? 'bg-yellow-50' : 'bg-gray-200'}`}>
                  <Icon className={isUnlocked ? badge.color : 'text-gray-400'} size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{badge.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                </div>
                {isUnlocked && (
                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Desbloqueado
                  </span>
                )}
              </div>
            );
          })}
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
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-primary font-bold">
                  +{activity.xpEarned || 0}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-700">{activity.title}</h4>
                  <p className="text-sm text-gray-400">
                    {activity.timestamp?.toDate().toLocaleDateString()} às {activity.timestamp?.toDate().toLocaleTimeString()}
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
