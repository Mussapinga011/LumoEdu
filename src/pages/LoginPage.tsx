import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../services/authService.supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { getErrorMessage } from '../utils/errorMessages';
import { loadProfileCache } from '../utils/profileCache';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setLoading, user } = useAuthStore();

  // Redirecionar automaticamente se já estiver logado
  useEffect(() => {
    if (user) {
      console.log('🔀 User already logged in, redirecting...');
      const destination = user.role === 'admin' ? '/admin' : '/learning';
      navigate(destination, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { user: supabaseUser } = await signIn({ email, password });
      
      if (supabaseUser) {
        console.log('✅ Login successful, waiting for profile...');
        
        // Aguardar um pouco para o perfil carregar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Tentar carregar do cache primeiro
        const cachedProfile = loadProfileCache(supabaseUser.id);
        
        if (cachedProfile) {
          console.log(`🔀 Redirecting ${cachedProfile.role} to appropriate page`);
          const destination = cachedProfile.role === 'admin' ? '/admin' : '/learning';
          navigate(destination, { replace: true });
        } else {
          // Fallback: redirecionar para learning e deixar o useEffect cuidar
          console.log('🔀 No cache, redirecting to /learning');
          navigate('/learning', { replace: true });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden mb-4 border-2 border-blue-100">
             <img src="/lumo_mascot.png" alt="Mascote LumoEdu" className="w-4/5 h-4/5 object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Boas-vindas!</h2>
          <p className="text-gray-500">Continue seus estudos no LumoEdu</p>
        </div>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-3 rounded-xl transition-colors shadow-[0_4px_0_0_#1899d6] active:shadow-none active:translate-y-[4px]"
          >
            ENTRAR
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-secondary font-bold hover:underline">
              Registar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
