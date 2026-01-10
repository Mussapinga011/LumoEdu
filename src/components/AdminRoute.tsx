import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useEffect, useState } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Dar tempo para o perfil carregar do banco
    if (!loading) {
      const timer = setTimeout(() => {
        setIsChecking(false);
      }, 1000); // Espera 1 segundo após loading=false
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Mostrar loading enquanto verifica
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Verificar se é admin
  if (!user || user.role !== 'admin') {
    console.warn('AdminRoute: Access denied. User role:', user?.role);
    return <Navigate to="/learning" replace />;
  }

  console.log('✅ AdminRoute: Access granted. User is admin.');
  return <>{children}</>;
};

export default AdminRoute;
