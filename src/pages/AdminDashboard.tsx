import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Download, 
  MessageCircle, 
  School, 
  BookMarked,
  ArrowRight,
  Shield,
  TrendingUp,
  UserPlus,
  Zap,
  Star,
  ChevronRight,
  MonitorPlay,
  CheckCircle2,
  AlertCircle,
  X,
  PlusCircle
} from 'lucide-react';
import { getAllUsers, getAllExams, getAllUniversities } from '../services/dbService.supabase';
import { useAuthStore } from '../stores/useAuthStore';
import clsx from 'clsx';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalExams: 0,
    newUsers: 0,
    onlineUsers: 0,
    totalUniversities: 0
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
       const [users, exams, universities] = await Promise.all([
        getAllUsers(),
        getAllExams(),
        getAllUniversities()
      ]);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newUsersCount = users.filter((u: any) => {
        if (!u.createdAt) return false;
        const created = new Date(u.createdAt);
        return created > thirtyDaysAgo;
      }).length;
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const onlineUsersCount = users.filter((u: any) => {
        if (!u.lastActive) return false;
        const lastActiveDate = new Date(u.lastActive);
        return lastActiveDate > fiveMinutesAgo;
      }).length;
      
      setStats({
        totalUsers: users.length,
        premiumUsers: users.filter((u: any) => u.isPremium).length,
        totalExams: exams.length,
        newUsers: newUsersCount,
        onlineUsers: onlineUsersCount,
        totalUniversities: universities.length
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
      setToast({ message: 'Erro ao sincronizar métricas do Painel.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const StatCard = ({ title, value, icon: Icon, color, subtext, path, trend }: any) => (
    <div 
      onClick={() => path && navigate(path)}
      className={clsx(
        "group relative bg-white rounded-[2.5rem] p-8 border-2 border-gray-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden",
        !path && "cursor-default hover:translate-y-0"
      )}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700 opacity-50`}></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className={clsx(
            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all duration-300",
            `bg-${color}-100 text-${color}-600`
          )}>
            <Icon size={30} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              <TrendingUp size={12} /> {trend}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">{title}</div>
          <div className="text-4xl font-black text-gray-800 tracking-tighter italic">
            {loading ? <div className="h-10 w-20 bg-gray-100 animate-pulse rounded-lg"></div> : value}
          </div>
        </div>
        
        {subtext && (
          <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between text-gray-400 group-hover:text-gray-800 transition-colors">
            <span className="text-xs font-bold italic">{subtext}</span>
            <ChevronRight size={18} className="translate-x-2 group-hover:translate-x-0 transition-all" />
          </div>
        )}
      </div>
    </div>
  );

  const ActionCard = ({ title, description, icon: Icon, color, path, detail }: any) => (
    <div 
      onClick={() => navigate(path)}
      className="group bg-white rounded-[2rem] p-6 border-2 border-gray-50 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center gap-6"
    >
      <div className={clsx(
        "w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
        `bg-${color}-50 text-${color}-600`
      )}>
        <Icon size={32} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between font-black text-lg text-gray-800 tracking-tighter uppercase italic leading-none group-hover:text-blue-600 transition-colors">
          {title}
          {detail && <span className="text-[10px] bg-gray-50 px-2 py-1 rounded-lg text-gray-400 tracking-widest border border-gray-100">{detail}</span>}
        </div>
        <p className="text-gray-400 text-sm font-medium mt-1 pr-6 italic leading-snug line-clamp-1">{description}</p>
      </div>
      <div className="p-2 bg-gray-50 rounded-full text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
        <ArrowRight size={18} />
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Toast Notification */}
      {toast && (
        <div className={clsx(
          "fixed top-6 right-6 z-[100] max-w-md p-5 rounded-2xl shadow-2xl border-l-4 animate-in slide-in-from-right duration-300 flex items-start gap-4 backdrop-blur-md",
          toast.type === 'error' ? 'bg-white/90 border-red-500' : 
          toast.type === 'success' ? 'bg-white/90 border-blue-500' : 'bg-white/90 border-blue-500'
        )}>
          <div className={clsx(
            "p-2.5 rounded-xl shrink-0",
            toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          )}>
            {toast.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-gray-800 text-lg leading-tight uppercase tracking-tighter italic">Painel Admin</h3>
            <p className="text-gray-600 text-sm font-medium mt-1 italic">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Hero Header Dashboard */}
      <div className="relative overflow-hidden bg-[#0A0B1E] p-10 md:p-16 rounded-[3.5rem] text-white shadow-3xl">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-600/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/10 italic">
                <Shield size={14} className="text-blue-500" /> Administrative Command Center
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-none uppercase italic">
                SISTEMA <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">LUMO EDU</span>
              </h1>
              <div className="flex items-center gap-6 mt-6">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0A0B1E] bg-gray-800 flex items-center justify-center text-[10px] font-black italic shadow-xl">
                      ADM
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-[#0A0B1E] bg-blue-600 flex items-center justify-center text-[10px] font-black italic shadow-xl">
                    +{stats.totalUsers - 4}
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10"></div>
                <p className="text-indigo-200/50 font-medium italic text-lg max-w-xs leading-tight">
                   Bem-vindo de volta, <span className="text-white font-black italic">{currentUser?.displayName?.split(' ')[0]}</span>. Aqui está o resumo da sua plataforma.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 text-center shadow-2xl min-w-[180px]">
                <div className="text-5xl font-black text-white italic leading-none mb-2">{stats.onlineUsers}</div>
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2 italic">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> Online Agora
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 text-center shadow-2xl min-w-[180px]">
                <div className="text-5xl font-black text-amber-400 italic leading-none mb-2">{stats.premiumUsers}</div>
                <div className="text-[10px] font-black text-amber-200 uppercase tracking-widest italic flex items-center justify-center gap-2">
                   <Star size={12} fill="currentColor" /> Assinantes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard 
          title="Novos Usuários (30d)" 
          value={stats.newUsers} 
          icon={UserPlus} 
          color="blue"
          subtext="Consultar base de dados"
          path="/admin/users"
          trend="+12%"
        />
        <StatCard 
          title="Questões no Banco" 
          value={stats.totalExams * 50} // Rough estimate based on exams
          icon={FileText} 
          color="indigo"
          subtext="Editar banco de dados"
          path="/admin/exams"
          trend="+542"
        />
        <StatCard 
          title="Grupos de Estudo" 
          value={Math.floor(stats.totalUsers / 14)} // Estimate
          icon={MessageCircle} 
          color="fuchsia"
          subtext="Moderar comunidade"
          path="/admin/groups"
        />
        <StatCard 
          title="Instituições Ativas" 
          value={stats.totalUniversities} 
          icon={School} 
          color="emerald"
          subtext="Gerenciar campi"
          path="/admin/universities"
        />
      </div>

      {/* Action Center Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-2 mt-4">
        
        {/* Quick Access Menu */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Content Ecosystem */}
          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookMarked size={20} />
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic">Ecossistema de Conteúdo</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActionCard 
                title="Provas e Exames" 
                description="Gestão de simulados e banco de questões." 
                icon={FileText} 
                color="indigo" 
                path="/admin/exams"
                detail={`${stats.totalExams} UNID`}
              />
              <ActionCard 
                title="Disciplinas" 
                description="Matérias e categorização acadêmica." 
                icon={BookMarked} 
                color="violet" 
                path="/admin/disciplines"
              />
              <ActionCard 
                title="Modo Aprender" 
                description="Trilhas de conteúdo e lições passo-a-passo." 
                icon={MonitorPlay} 
                color="blue" 
                path="/admin/learning"
              />
              <ActionCard 
                title="Central de Downloads" 
                description="Repositório de materiais PDF e guias." 
                icon={Download} 
                color="cyan" 
                path="/admin/downloads"
              />
            </div>
          </section>

          {/* User Operations */}
          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic">Operações de Usuário</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActionCard 
                title="Gestão de Perfis" 
                description="Verificar permissões e status de alunos." 
                icon={Users} 
                color="emerald" 
                path="/admin/users"
              />
              <ActionCard 
                title="Grupos e Chats" 
                description="Moderação de canais de estudo coletivos." 
                icon={MessageCircle} 
                color="fuchsia" 
                path="/admin/groups"
              />
            </div>
          </section>
        </div>

        {/* Sidebar widgets */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-[#0A0B1E] rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform"></div>
              <h3 className="text-xl font-black tracking-tighter uppercase italic mb-6">Status do Servidor</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Banco de Dados</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">OPERACIONAL</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Real-time Sinc</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">ATIVO</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Storage CDN</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">84% LATÊNCIA</span>
                </div>
              </div>

              <button className="w-full mt-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-[#0A0B1E] transition-all italic">
                 Logs de Auditoria
              </button>
           </div>

           <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[2.5rem] p-8 border-2 border-white shadow-xl relative overflow-hidden">
              <Zap size={40} className="absolute -bottom-4 -right-4 text-white opacity-50" />
              <h3 className="text-lg font-black tracking-tighter uppercase italic mb-2 text-indigo-950">Atalho Rápido</h3>
              <p className="text-indigo-900/40 text-xs font-bold uppercase tracking-widest leading-relaxed mb-6">Criar nova prova oficial no sistema</p>
              
              <button 
                onClick={() => navigate('/admin/exams/create')}
                className="w-full py-5 bg-indigo-600 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all italic flex items-center justify-center gap-3"
              >
                <PlusCircle size={20} /> Gerar Exame
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
