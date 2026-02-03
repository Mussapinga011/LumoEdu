
import { useAuthStore } from '../stores/useAuthStore';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { User, Flame, Calendar, Settings, LayoutDashboard } from 'lucide-react';
import { updateUserProfile } from '../services/dbService.supabase';
import clsx from 'clsx';
import OptimizedImage from '../components/OptimizedImage';

const ProfilePage = () => {
  const { user, isAdmin, hasPremiumAccess } = useAuth();
  const { updateUser } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      
      {/* 1. HEADER & INFO */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />

        <div className="relative">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border-4 border-white shadow-xl overflow-hidden ring-4 ring-primary/10">
            {user.photoURL ? (
              <OptimizedImage src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <User size={64} />
            )}
          </div>
          <div className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-md border border-gray-100">
             <Settings size={18} className="text-gray-400" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2 relative z-10">
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">{user.displayName}</h1>
          <p className="text-gray-500 font-medium">{user.email}</p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
            <span className={clsx(
              "px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest",
              hasPremiumAccess ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"
            )}>
              {hasPremiumAccess ? 'Membro Premium' : 'Plano Gratuito'}
            </span>
            {isAdmin && (
              <span className="px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest bg-purple-100 text-purple-700">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-6 relative z-10">
           <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center min-w-[100px]">
             <div className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
               <Flame size={20} className="fill-current" /> {user.streak || 0}
             </div>
             <div className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mt-1">Dias Seguidos</div>
           </div>
           
           <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center min-w-[100px]">
             <div className="text-2xl font-black text-blue-500 flex items-center justify-center gap-1">
               <Calendar size={20} className="fill-current" /> {user.dailyExercisesCount || 0}
             </div>
             <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-1">Hoje</div>
           </div>
        </div>
      </div>

      {/* 2. DASHBOARD CTA */}
      <button 
        onClick={() => navigate('/dashboard')}
        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-3xl shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
             <LayoutDashboard size={32} className="text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-black mb-1">Painel Acadêmico</h2>
            <p className="text-blue-100 text-sm font-medium">Veja seu progresso detalhado, metas e recomendações.</p>
          </div>
        </div>
        <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
          →
        </div>
      </button>

      {/* 3. SETTINGS */}
      <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
        <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
          <Settings size={20} className="text-gray-400" />
          Preferências
        </h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <h4 className="font-bold text-gray-800">Modo Poupança de Dados</h4>
              <p className="text-sm text-gray-500 mt-1">Não carregar imagens pesadas automaticamente.</p>
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
                "w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out relative",
                user.dataSaverMode ? "bg-primary" : "bg-gray-300"
              )}
            >
              <div 
                className={clsx(
                  "w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out absolute top-1 left-1",
                  user.dataSaverMode ? "translate-x-6" : "translate-x-0"
                )} 
              />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
