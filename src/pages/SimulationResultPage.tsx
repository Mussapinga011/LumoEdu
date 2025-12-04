import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Clock, CheckCircle } from 'lucide-react';

const SimulationResultPage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const savedResult = sessionStorage.getItem('simulationResult');
    if (!savedResult) {
      navigate('/simulation/config');
      return;
    }
    setResult(JSON.parse(savedResult));
  }, [navigate]);

  if (!result) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  const percentage = Math.round((result.correctCount / result.totalQuestions) * 100);
  const minutes = Math.floor(result.timeSpent / 60);
  const seconds = result.timeSpent % 60;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-gray-100">
          <div className="text-6xl mb-4">
            {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚'}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Simulado Concluído!</h1>
          <p className="text-gray-500">
            {percentage >= 80 ? 'Excelente desempenho!' : 
             percentage >= 60 ? 'Bom trabalho!' : 
             'Continue estudando!'}
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Resumo do Desempenho</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Trophy className="mx-auto mb-2 text-blue-600" size={32} />
              <div className="text-3xl font-bold text-blue-600">{result.score}/20</div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Nota</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
              <div className="text-3xl font-bold text-green-600">{result.correctCount}</div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Acertos</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Target className="mx-auto mb-2 text-purple-600" size={32} />
              <div className="text-3xl font-bold text-purple-600">{percentage}%</div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Precisão</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <Clock className="mx-auto mb-2 text-orange-600" size={32} />
              <div className="text-3xl font-bold text-orange-600">{minutes}:{seconds.toString().padStart(2, '0')}</div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Tempo</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progresso</span>
              <span>{result.correctCount}/{result.totalQuestions} questões corretas</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/simulation/config')}
              className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
            >
              🔄 Novo Simulado
            </button>
            <button 
              onClick={() => navigate('/simulation/history')}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              📊 Ver Histórico
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              👤 Ir para Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationResultPage;
