import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Componente que redireciona automaticamente baseado no role do usuário
 * Admin -> /admin
 * User -> /learning
 * Não logado -> /login
 */
const HomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('🔀 No user, redirecting to /landing');
        navigate('/landing', { replace: true });
      } else if (user.role === 'admin') {
        console.log('🔀 Admin user, redirecting to /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('🔀 Regular user, redirecting to /learning');
        navigate('/learning', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Mostrar loading enquanto verifica
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Carregando...</p>
      </div>
    </div>
  );
};

export default HomePage;
