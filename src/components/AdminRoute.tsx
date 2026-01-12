import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useEffect, useState } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuthStore();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Dar tempo para o perfil carregar
    if (!loading && !hasChecked) {
      const timer = setTimeout(() => {
        setIsChecking(false);
        setHasChecked(true);
      }, 2000); // Espera 2 segundos
      return () => clearTimeout(timer);
    } else if (!loading) {
      setIsChecking(false);
    }
  }, [loading, hasChecked]);

  // Mostrar loading enquanto verifica
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  // Verificar se é admin
  if (!user || user.role !== 'admin') {
    console.warn('AdminRoute: Access denied. User role:', user?.role, '| Path:', location.pathname);
    return <Navigate to="/learning" replace />;
  }

  console.log('✅ AdminRoute: Access granted for admin user');
  return <>{children}</>;
};

export default AdminRoute;
