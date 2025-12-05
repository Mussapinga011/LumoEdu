import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { getUserSimulations } from '../services/simulationService';
import { SimulationResult } from '../types/simulation';
import { Trophy, Target, Clock, Calendar, ArrowLeft, BookOpen } from 'lucide-react';
import clsx from 'clsx';

const SimulationHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [simulations, setSimulations] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      const history = await getUserSimulations(user.uid);
      setSimulations(history);
      setLoading(false);
    };

    fetchHistory();
  }, [user, navigate]);

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      weaknesses: 'Fraquezas',
      revision: 'Revisão',
      difficult: 'Difíceis',
      random: 'Aleatório',
      custom: 'Personalizado'
    };
    return labels[mode] || mode;
  };

  const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      weaknesses: 'bg-red-100 text-red-700',
      revision: 'bg-blue-100 text-blue-700',
      difficult: 'bg-orange-100 text-orange-700',
      random: 'bg-purple-100 text-purple-700',
      custom: 'bg-gray-100 text-gray-700'
    };
    return colors[mode] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/simulation/config')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Histórico de Simulados</h1>
          <p className="text-gray-500 mt-1">Acompanhe seu progresso e desempenho</p>
        </div>
      </div>

      {/* Stats Summary */}
      {simulations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Resumo Geral</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <BookOpen className="mx-auto mb-2 text-blue-600" size={24} />
              <div className="text-2xl font-bold text-blue-600">{simulations.length}</div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Simulados</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Target className="mx-auto mb-2 text-green-600" size={24} />
              <div className="text-2xl font-bold text-green-600">
                {Math.round(simulations.reduce((acc, s) => acc + (s.score / s.totalQuestions) * 20, 0) / simulations.length * 10) / 10}
              </div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Média</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Trophy className="mx-auto mb-2 text-purple-600" size={24} />
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((simulations.reduce((acc, s) => acc + s.correctCount, 0) / simulations.reduce((acc, s) => acc + s.totalQuestions, 0)) * 100)}%
              </div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Precisão</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <Clock className="mx-auto mb-2 text-orange-600" size={24} />
              <div className="text-2xl font-bold text-orange-600">
                {Math.floor(simulations.reduce((acc, s) => acc + (s.timeSpent || 0), 0) / 60)}min
              </div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Tempo Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Simulations List */}
      {simulations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum Simulado Realizado</h3>
          <p className="text-gray-500 mb-6">Comece agora e acompanhe seu progresso!</p>
          <button
            onClick={() => navigate('/simulation/config')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
          >
            Criar Primeiro Simulado
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {simulations.map((simulation, index) => {
            const percentage = Math.round((simulation.correctCount / simulation.totalQuestions) * 100);
            const score = (simulation.correctCount / simulation.totalQuestions) * 20;
            const minutes = Math.floor((simulation.timeSpent || 0) / 60);
            const seconds = (simulation.timeSpent || 0) % 60;

            return (
              <div
                key={simulation.id || index}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left: Mode and Date */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={clsx('px-3 py-1 rounded-full text-xs font-bold', getModeColor(simulation.config.mode))}>
                        {getModeLabel(simulation.config.mode)}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(simulation.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{simulation.totalQuestions} questões</span>
                      {simulation.timeSpent && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {minutes}:{seconds.toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Stats */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{score.toFixed(1)}/20</div>
                      <div className="text-xs text-gray-500 uppercase">Nota</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{simulation.correctCount}</div>
                      <div className="text-xs text-gray-500 uppercase">Acertos</div>
                    </div>
                    <div className="text-center">
                      <div className={clsx(
                        'text-2xl font-bold',
                        percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {percentage}%
                      </div>
                      <div className="text-xs text-gray-500 uppercase">Precisão</div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={clsx(
                        'h-full transition-all duration-500',
                        percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Simulation Button */}
      {simulations.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/simulation/config')}
            className="bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-lg"
          >
            🎯 Criar Novo Simulado
          </button>
        </div>
      )}
    </div>
  );
};

export default SimulationHistoryPage;
