import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Book, 
  FileText, 
  Download, 
  MessageCircle, 
  School, 
  BookMarked,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { getAllUsers, getAllExams, getAllUniversities } from '../services/dbService.supabase';
import { useToast } from '../hooks/useNotifications';
import Toast from '../components/Toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalExams: 0,
    newUsers: 0,
    onlineUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const { toastState, closeToast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
       const [users, exams, universities] = await Promise.all([
        getAllUsers(),
        getAllExams(),
        getAllUniversities()
      ]);
      
      setIsDbEmpty(universities.length === 0);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newUsersCount = users.filter((u: any) => {
        if (!u.createdAt) return false;
        const created = new Date(u.createdAt);
        return created > thirtyDaysAgo;
      }).length;
      
      // Calculate online users (active in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const onlineUsersCount = users.filter((u: any) => {
        if (!u.lastActive) return false;
        const lastActiveDate = new Date(u.lastActive);
        return lastActiveDate > fiveMinutesAgo && u.isOnline;
      }).length;
      
      setStats({
        totalUsers: users.length,
        premiumUsers: users.filter((u: any) => u.isPremium).length,
        totalExams: exams.length,
        newUsers: newUsersCount,
        onlineUsers: onlineUsersCount
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, gradient, subtext, onClick, large = false }: any) => (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out cursor-pointer group hover:scale-[1.02] ${large ? 'md:col-span-2' : ''} bg-gradient-to-br ${gradient}`}
    >
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/80 font-medium uppercase tracking-wider text-xs md:text-sm mb-1">{title}</p>
            {loading ? (
              <div className="h-10 md:h-14 w-24 bg-white/20 rounded-lg animate-pulse my-2"></div>
            ) : (
              <h3 className={`font-bold text-white ${large ? 'text-5xl md:text-6xl' : 'text-4xl'}`}>
                {value}
              </h3>
            )}
          </div>
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm group-hover:bg-white/20 transition-colors">
            <Icon size={large ? 32 : 24} className="text-white" />
          </div>
        </div>
        
        {subtext && (
          <div className="mt-4 flex items-center gap-2 text-white/70 text-sm group-hover:text-white transition-colors">
             <span>{subtext}</span>
             <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
      
      {/* Decorative background icon */}
      <div className="absolute -right-6 -bottom-6 text-white opacity-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
        <Icon size={160} />
      </div>
      
      {/* Texture overlay */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
    </div>
  );

  const ActionCard = ({ title, description, icon: Icon, color, path, badge }: any) => (
    <button
      onClick={() => navigate(path)}
      className="relative flex flex-col items-start p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group overflow-hidden w-full text-left"
    >
      <div className={`absolute top-0 left-0 w-1 h-full bg-${color}-500`} />
      
      <div className="flex justify-between w-full mb-4">
        <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={28} />
        </div>
        {badge && (
          <span className={`px-2 py-1 bg-${color}-50 text-${color}-700 text-xs font-bold rounded-full h-fit`}>
            {badge}
          </span>
        )}
      </div>
      
      <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      
      <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
        <ArrowRight size={20} className={`text-${color}-500`} />
      </div>
    </button>
  );

  return (
    <div className="space-y-10 pb-12">
      <div className="pt-2 border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent inline-flex items-center gap-3">
          Painel Administrativo <Sparkles className="text-amber-400" size={24} />
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Visão geral e gestão do sistema</p>
      </div>

      {isDbEmpty && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl shadow-sm">
          <div className="flex items-center gap-3">
            <Activity className="text-amber-500" />
            <h3 className="font-bold text-amber-900 text-lg">Banco de Dados Inicializado</h3>
          </div>
          <p className="text-amber-700 mt-1 ml-9">O conteúdo está sendo carregado via Supabase.</p>
        </div>
      )}

      {/* Stats Grid - Priority Focused */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Highest Priority: New Users & Exams */}
        <StatCard 
          title="Novos Usuários (30d)" 
          value={stats.newUsers} 
          icon={Users} 
          gradient="from-orange-500 to-rose-600"
          subtext="Ver lista completa"
          onClick={() => navigate('/admin/users')}
          large={true}
        />
        
        <StatCard 
          title="Total de Exames" 
          value={stats.totalExams} 
          icon={FileText} 
          gradient="from-teal-500 to-cyan-600"
          subtext="Gerenciar conteúdo"
          onClick={() => navigate('/admin/exams')}
          large={true}
        />

        {/* Secondary Stats */}
        <StatCard 
          title="Total de Usuários" 
          value={stats.totalUsers} 
          icon={Users} 
          gradient="from-blue-600 to-indigo-700"
          onClick={() => navigate('/admin/users')}
        />

        <StatCard 
          title="Usuários Premium" 
          value={stats.premiumUsers} 
          icon={Book} 
          gradient="from-amber-500 to-yellow-600"
          onClick={() => navigate('/admin/users')}
        />

        <StatCard 
          title="Usuários Online" 
          value={stats.onlineUsers} 
          icon={Activity} 
          gradient="from-emerald-500 to-green-600"
          subtext="Ativos em 5min"
          onClick={() => navigate('/admin/users')}
        />
        
        {/* Placeholder for symmetry or extra stat */}
        <div className="hidden lg:block bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 font-medium p-6">
            <span className="text-sm">Mais métricas em breve</span>
        </div>
      </div>

      {/* Quick Actions Sections */}
      <div className="space-y-8">
        
        {/* Gestão de Conteúdo */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <BookMarked className="text-gray-400" size={20} />
            <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide text-sm">Gestão de Conteúdo</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <ActionCard 
              title="Exames e Questões" 
              description="Gerenciar banco de questões e provas completas." 
              icon={FileText} 
              color="teal" 
              path="/admin/exams"
              badge={`${stats.totalExams} exames`}
            />
            <ActionCard 
              title="Disciplinas" 
              description="Configurar matérias e áreas de conhecimento." 
              icon={BookMarked} 
              color="violet" 
              path="/admin/disciplines"
            />
            <ActionCard 
              title="Conteúdo Aprender" 
              description="Seções e aulas do modo de aprendizado." 
              icon={School} 
              color="emerald" 
              path="/admin/learning"
            />
          </div>
        </section>

        {/* Gestão de Usuários & Grupos */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Users className="text-gray-400" size={20} />
            <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide text-sm">Comunidade</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <ActionCard 
              title="Usuários" 
              description="Gerenciar contas, permissões e planos." 
              icon={Users} 
              color="blue" 
              path="/admin/users"
              badge={`${stats.totalUsers} total`}
            />
            <ActionCard 
              title="Grupos de Estudo" 
              description="Monitorar e moderar grupos de alunos." 
              icon={MessageCircle} 
              color="pink" 
              path="/admin/groups"
            />
          </div>
        </section>

        {/* Recursos e Sistema */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Download className="text-gray-400" size={20} />
            <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide text-sm">Recursos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <ActionCard 
              title="Downloads" 
              description="Gerenciar arquivos e materiais para baixar." 
              icon={Download} 
              color="indigo" 
              path="/admin/downloads"
            />
          </div>
        </section>
      </div>

      {/* Toast notifications */}
      {toastState.isOpen && (
        <Toast
          message={toastState.message}
          type={toastState.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
