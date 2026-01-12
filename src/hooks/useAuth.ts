import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../lib/supabase';

/**
 * Hook para gerenciar autenticação de forma centralizada
 * Lida com cache, timeout e fallbacks
 */
export const useAuth = () => {
  const { user, loading, initAuth } = useAuthStore();

  useEffect(() => {
    // Inicializar autenticação apenas uma vez
    initAuth();
  }, []);

  const logout = async () => {
    try {
      // Limpar cache do localStorage
      if (user?.id) {
        localStorage.removeItem(`profile_${user.id}`);
      }
      
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isPremium: user?.isPremium || false,
    logout
  };
};
