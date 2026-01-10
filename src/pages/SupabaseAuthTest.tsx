import { useState } from 'react';
import { signUp, signIn, signOut, getCurrentUser, getUserProfile } from '../services/authService.supabase';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

const SupabaseAuthTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleSignUp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await signUp({ email, password, displayName });
      setMessage({ type: 'success', text: `✅ Usuário criado! ID: ${result.user?.id}` });
      
      // Buscar perfil criado
      if (result.user) {
        const profile = await getUserProfile(result.user.id);
        console.log('Perfil criado:', profile);
      }
    } catch (error: any) {
      console.error('Erro detalhado no SignUp:', error);
      const errorMsg = error.message || JSON.stringify(error, null, 2);
      setMessage({ type: 'error', text: `❌ Erro registro: ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await signIn({ email, password });
      setMessage({ type: 'success', text: `✅ Login realizado! Bem-vindo!` });
      
      // Buscar usuário atual
      const user = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        setCurrentUser({ ...user, profile });
        console.log('Usuário logado:', { user, profile });
      }
    } catch (error: any) {
      console.error('Erro detalhado no SignIn:', error);
      const errorMsg = error.message || JSON.stringify(error, null, 2);
      setMessage({ type: 'error', text: `❌ Erro login: ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await signOut();
      setMessage({ type: 'success', text: '✅ Logout realizado!' });
      setCurrentUser(null);
    } catch (error: any) {
      console.error('Erro detalhado no SignOut:', error);
      const errorMsg = error.message || JSON.stringify(error, null, 2);
      setMessage({ type: 'error', text: `❌ Erro logout: ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSession = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const user = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        setCurrentUser({ ...user, profile });
        setMessage({ type: 'success', text: '✅ Sessão ativa encontrada!' });
        console.log('Sessão atual:', { user, profile });
      } else {
        setMessage({ type: 'error', text: '❌ Nenhuma sessão ativa' });
        setCurrentUser(null);
      }
    } catch (error: any) {
      console.error('Erro detalhado no CheckSession:', error);
      const errorMsg = error.message || JSON.stringify(error, null, 2);
      setMessage({ type: 'error', text: `❌ Erro verificação: ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🧪 Teste de Autenticação Supabase</h1>
          <p className="text-gray-500 mb-6">Teste as funcionalidades de autenticação antes da migração completa</p>

          {/* Mensagem de Feedback */}
          {message && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          {/* Formulário */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nome (apenas para registro)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Seu Nome"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={handleSignUp}
              disabled={loading || !email || !password || !displayName}
              className="bg-green-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : '📝'} Registrar
            </button>

            <button
              onClick={handleSignIn}
              disabled={loading || !email || !password}
              className="bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : '🔐'} Login
            </button>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="bg-red-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : '🚪'} Logout
            </button>

            <button
              onClick={handleCheckSession}
              disabled={loading}
              className="bg-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : '🔍'} Verificar
            </button>
          </div>
        </div>

        {/* Informações do Usuário Atual */}
        {currentUser && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">👤 Usuário Atual</h2>
            <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm overflow-auto">
              <pre>{JSON.stringify(currentUser, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            📋 Instruções de Teste
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Preencha email, senha e nome</li>
            <li>Clique em <strong>"Registrar"</strong> para criar uma conta</li>
            <li>Verifique se o perfil foi criado no console do navegador</li>
            <li>Faça <strong>"Logout"</strong></li>
            <li>Faça <strong>"Login"</strong> com as mesmas credenciais</li>
            <li>Clique em <strong>"Verificar"</strong> para ver a sessão ativa</li>
            <li>Abra o Supabase Dashboard → Table Editor → user_profiles para ver o registro</li>
          </ol>
        </div>

        {/* Link para Dashboard */}
        <div className="mt-6 text-center">
          <a
            href="https://supabase.com/dashboard/project/kscyzmuxlpmdaacyerob/editor"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-900"
          >
            🗄️ Abrir Supabase Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupabaseAuthTest;
