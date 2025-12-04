import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '../stores/useContentStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Zap, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

const ChallengeSelectDisciplinePage = () => {
  const { disciplines, fetchDisciplines, loading } = useContentStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedUniversity, setSelectedUniversity] = useState<'UEM' | 'UP'>('UEM');

  useEffect(() => {
    fetchDisciplines();
  }, [fetchDisciplines]);

  // Check if user has challenges left today
  const getChallengesLeft = () => {
    if (!user) return 0;
    if (user.isPremium) return -1; // -1 means unlimited
    
    // Check if user already took a challenge today
    if (user.lastChallengeDate) {
      const lastChallengeDate = user.lastChallengeDate.toDate();
      const today = new Date();
      
      if (
        lastChallengeDate.getDate() === today.getDate() &&
        lastChallengeDate.getMonth() === today.getMonth() &&
        lastChallengeDate.getFullYear() === today.getFullYear()
      ) {
        return 0; // No challenges left today
      }
    }
    return 1; // 1 challenge available
  };

  const challengesLeft = getChallengesLeft();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredDisciplines = disciplines.filter(d => d.university === selectedUniversity);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 text-danger rounded-xl">
            <Zap size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Modo Desafio</h1>
            <p className="text-gray-500">Selecione uma disciplina para testar seus conhecimentos.</p>
          </div>
        </div>
        
        {/* University Tabs */}
        <div className="bg-gray-100 p-1 rounded-xl inline-flex">
          <button
            onClick={() => setSelectedUniversity('UEM')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              selectedUniversity === 'UEM' 
                ? "bg-white text-primary shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            UEM
          </button>
          <button
            onClick={() => setSelectedUniversity('UP')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all",
              selectedUniversity === 'UP' 
                ? "bg-white text-primary shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            UP
          </button>
        </div>
      </div>

      {/* Challenges Status Banner */}
      {user && !user.isPremium && (
        <div className={clsx(
          "rounded-xl p-4 border-2",
          challengesLeft > 0 
            ? "bg-blue-50 border-blue-200" 
            : "bg-red-50 border-red-200"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={clsx(
                "font-bold mb-1",
                challengesLeft > 0 ? "text-blue-800" : "text-red-800"
              )}>
                {challengesLeft > 0 
                  ? `🎯 Você tem ${challengesLeft} desafio disponível hoje` 
                  : "🚫 Limite diário atingido"}
              </h3>
              <p className={clsx(
                "text-sm",
                challengesLeft > 0 ? "text-blue-600" : "text-red-600"
              )}>
                {challengesLeft > 0 
                  ? "Usuários gratuitos podem fazer 1 desafio por dia" 
                  : "Volte amanhã ou atualize para Premium para desafios ilimitados"}
              </p>
            </div>
            {challengesLeft === 0 && (
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition-colors text-sm whitespace-nowrap"
              >
                ⭐ Premium
              </button>
            )}
          </div>
        </div>
      )}
      
      <div>
        <h2 className="text-xl font-bold text-gray-700 mb-6">
          {selectedUniversity === 'UEM' ? 'Universidade Eduardo Mondlane' : 'Universidade Pedagógica'}
        </h2>

        {filteredDisciplines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDisciplines.map((discipline) => (
              <button 
                key={discipline.id}
                onClick={() => navigate(`/challenge/select-exam/${discipline.id}`)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:border-danger hover:shadow-xl transition-all text-left group"
              >
                <div className={clsx("h-32 flex items-center justify-center text-5xl transition-transform group-hover:scale-110", discipline.color)}>
                  {discipline.icon}
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{discipline.title}</h2>
                  <div className="flex items-center text-danger font-bold text-sm uppercase tracking-wide">
                    Iniciar Desafio <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500">Nenhuma disciplina encontrada para esta universidade.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeSelectDisciplinePage;
