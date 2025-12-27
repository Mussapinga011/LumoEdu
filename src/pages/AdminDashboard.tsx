import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Book, Check, FileText } from 'lucide-react';
import { getAllUsers, getAllExams, getAllUniversities, initializeDefaultContent } from '../services/dbService';
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
  const [migrating, setMigrating] = useState(false);
  const { toastState, showSuccess, showError, closeToast } = useToast();

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
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

      const newUsersCount = users.filter(u => {
        if (!u.createdAt) return false;
        return u.createdAt.toDate() > thirtyDaysAgo;
      }).length;
      
      // Calculate online users (active in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const onlineUsersCount = users.filter(u => {
        if (!u.lastActive) return false;
        const lastActiveDate = u.lastActive.toDate();
        return lastActiveDate > fiveMinutesAgo && u.isOnline;
      }).length;
      
      setStats({
        totalUsers: users.length,
        premiumUsers: users.filter(u => u.isPremium).length,
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

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      await initializeDefaultContent();
      showSuccess('Conteúdo inicial (UEM/UP) criado com sucesso!');
      setIsDbEmpty(false);
      fetchStats();
    } catch (error: any) {
      showError('Erro na migração: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Painel Administrativo</h1>

      {/* Migration Warning */}
      {isDbEmpty && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <Book size={24} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Configuração Inicial Necessária</h3>
              <p className="text-amber-700">O banco de dados de universidades e disciplinas está vazio.</p>
            </div>
          </div>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {migrating ? 'Criando conteúdo...' : 'Povoar com UEM/UP e Disciplinas'}
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        {/* Online Users */}
        <div className="bg-emerald-500 rounded-lg shadow-lg p-4 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-4xl font-bold mb-2">{loading ? '...' : stats.onlineUsers}</h3>
            <p className="text-emerald-100 font-medium uppercase tracking-wide text-sm">Usuários Online</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-emerald-600 opacity-30 group-hover:scale-110 transition-transform">
            <div className="relative">
              <Users size={100} />
              <div className="absolute top-2 right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-emerald-500 animate-pulse"></div>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-emerald-400/30 flex items-center justify-between text-sm text-emerald-100 cursor-pointer hover:text-white transition-colors" onClick={() => navigate('/admin/users')}>
            <span>Ativos nos últimos 5min</span>
            <span>→</span>
          </div>
        </div>
        
        {/* Total Users */}
        <div className="bg-blue-500 rounded-lg shadow-lg p-4 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-4xl font-bold mb-2">{loading ? '...' : stats.totalUsers}</h3>
            <p className="text-blue-100 font-medium uppercase tracking-wide text-sm">Total de Usuários</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-blue-600 opacity-30 group-hover:scale-110 transition-transform">
            <Users size={100} />
          </div>
          <div className="mt-4 pt-2 border-t border-blue-400/30 flex items-center justify-between text-sm text-blue-100 cursor-pointer hover:text-white transition-colors" onClick={() => navigate('/admin/users')}>
            <span>Mais informações</span>
            <span>→</span>
          </div>
        </div>

        {/* Premium Users */}
        <div className="bg-yellow-500 rounded-lg shadow-lg p-4 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-4xl font-bold mb-2">{loading ? '...' : stats.premiumUsers}</h3>
            <p className="text-yellow-100 font-medium uppercase tracking-wide text-sm">Usuários Premium</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-yellow-600 opacity-30 group-hover:scale-110 transition-transform">
            <Check size={100} />
          </div>
          <div className="mt-4 pt-2 border-t border-yellow-400/30 flex items-center justify-between text-sm text-yellow-100 cursor-pointer hover:text-white transition-colors" onClick={() => navigate('/admin/users')}>
            <span>Mais informações</span>
            <span>→</span>
          </div>
        </div>

        {/* Total Exams */}
        <div className="bg-green-500 rounded-lg shadow-lg p-4 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-4xl font-bold mb-2">{loading ? '...' : stats.totalExams}</h3>
            <p className="text-green-100 font-medium uppercase tracking-wide text-sm">Total de Exames</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-green-600 opacity-30 group-hover:scale-110 transition-transform">
            <Book size={100} />
          </div>
          <div className="mt-4 pt-2 border-t border-green-400/30 flex items-center justify-between text-sm text-green-100 cursor-pointer hover:text-white transition-colors" onClick={() => navigate('/admin/exams')}>
            <span>Mais informações</span>
            <span>→</span>
          </div>
        </div>

        {/* New Registrations */}
        <div className="bg-red-500 rounded-lg shadow-lg p-4 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-4xl font-bold mb-2">{loading ? '...' : stats.newUsers}</h3>
            <p className="text-red-100 font-medium uppercase tracking-wide text-sm">Novos Usuários (30d)</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-red-600 opacity-30 group-hover:scale-110 transition-transform">
            <FileText size={100} />
          </div>
          <div className="mt-4 pt-2 border-t border-red-400/30 flex items-center justify-between text-sm text-red-100 cursor-pointer hover:text-white transition-colors">
            <span>Mais informações</span>
            <span>→</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-gray-800">Gestão</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <button
          onClick={() => navigate('/admin/exams')}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group"
        >
          <div className="p-4 bg-purple-100 text-purple-600 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Gerenciar Exames</h3>
          <p className="text-gray-500">Criar, editar e excluir exames e questões.</p>
        </button>

        <button
          onClick={() => navigate('/admin/users')}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group"
        >
          <div className="p-4 bg-blue-100 text-blue-600 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Gerenciar Usuários</h3>
          <p className="text-gray-500">Ver usuários, gerenciar papéis e permissões.</p>
        </button>
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

