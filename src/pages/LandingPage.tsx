import { Link, Navigate } from 'react-router-dom';
import { Globe, CheckCircle, Zap, Shield } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

const LandingPage = () => {
  const { user, loading } = useAuthStore();

  if (loading) return null;
  if (user) return <Navigate to="/learning" replace />;
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-4 max-w-5xl mx-auto w-full">
        <img src="/lumo_text.png" alt="LumoEdu" className="h-8 md:h-10 w-auto object-contain" />
        <div className="space-x-4">
          <Link 
            to="/login" 
            className="font-bold text-gray-500 hover:text-gray-700 uppercase tracking-wide text-xs md:text-sm"
          >
            Já tenho uma conta
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 py-12 max-w-5xl mx-auto w-full gap-12">
        <div className="flex-1 flex justify-center">
          <div className="relative group">
            {/* Mascot as main hero character */}
            <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-blue-50 to-green-50 rounded-full flex items-center justify-center relative shadow-2xl overflow-hidden animate-float">
               <img 
                 src="/lumo_mascot.png" 
                 alt="Mascote LumoEdu" 
                 className="w-4/5 h-4/5 object-contain"
               />
            </div>
            {/* Success badges surrounding mascot */}
            <div className="absolute -top-4 -right-4 bg-yellow-400 p-4 rounded-2xl shadow-lg -rotate-12 animate-bounce">
               <Zap size={32} className="text-white" />
            </div>
            <div className="absolute -bottom-2 -left-4 bg-secondary p-3 rounded-xl shadow-lg rotate-12">
               <Globe size={24} className="text-white" />
            </div>
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-6 md:space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800 leading-tight px-4 md:px-0">
            A forma grátis, divertida e eficaz de estudar para exames!
          </h2>
          <div className="flex flex-col gap-4 max-w-xs mx-auto md:mx-0">
            <Link 
              to="/register" 
              className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl shadow-[0_4px_0_0_#58a700] active:shadow-none active:translate-y-[4px] transition-all text-center uppercase tracking-wide"
            >
              Começar Agora
            </Link>
            <Link 
              to="/login" 
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-secondary font-bold py-3 px-8 rounded-xl shadow-[0_4px_0_0_#e5e5e5] active:shadow-none active:translate-y-[4px] transition-all text-center uppercase tracking-wide"
            >
              Já tenho uma conta
            </Link>
          </div>
        </div>
      </main>

      {/* Features Footer */}
      <footer className="border-t border-gray-200 py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="text-secondary" size={48} />
            <h3 className="text-xl font-bold text-gray-700">Aprendizagem Eficaz</h3>
            <p className="text-gray-500">Lições gamificadas que ajudam a reter informação.</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Zap className="text-accent" size={48} />
            <h3 className="text-xl font-bold text-gray-700">Mantenha-se Motivado</h3>
            <p className="text-gray-500">Ganhe pontos, sequências e suba no ranking.</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Shield className="text-danger" size={48} />
            <h3 className="text-xl font-bold text-gray-700">Pronto para o Exame</h3>
            <p className="text-gray-500">Pratique com exames anteriores reais e desafios.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
