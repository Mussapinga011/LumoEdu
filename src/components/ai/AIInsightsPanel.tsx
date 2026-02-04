import { useState, useEffect } from 'react';
import { AcademicAI } from '../../services/academicAI.service';
import type { 
  FuturePerformancePrediction, 
  LearningPlateauDetection,
  ScenarioSimulation,
  StudyPattern,
  SmartRecommendation
} from '../../types/academicAI';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Sparkles, 
  Target,
  Brain,
  Zap,
  Clock,
  Award,
  Sun,
  Sunset,
  Moon,
  Calendar as CalendarIcon,
  Lightbulb,
  Calendar
} from 'lucide-react';
import clsx from 'clsx';
import OptimizedSchedulePanel from './OptimizedSchedulePanel';

interface AIInsightsPanelProps {
  userId: string;
}

const AIInsightsPanel = ({ userId }: AIInsightsPanelProps) => {
  const [prediction, setPrediction] = useState<FuturePerformancePrediction | null>(null);
  const [plateau, setPlateau] = useState<LearningPlateauDetection | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSimulation[]>([]);
  const [studyPatterns, setStudyPatterns] = useState<StudyPattern | null>(null);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    loadAIInsights();
  }, [userId, selectedDays]);

  const loadAIInsights = async () => {
    setLoading(true);
    try {
      // 1. Carregar predição
      const predictionData = await AcademicAI.predictFuturePerformance(userId, selectedDays);
      setPrediction(predictionData);

      // 2. Detectar platô
      const plateauData = await AcademicAI.detectLearningPlateau(userId);
      setPlateau(plateauData);

      // 3. Simular cenários
      const scenarioData = await AcademicAI.simulateStudyScenarios(userId, [
        { hoursPerDay: 1, days: 30 },
        { hoursPerDay: 2, days: 30 },
        { hoursPerDay: 3, days: 30 },
        { hoursPerDay: 4, days: 30 }
      ]);
      setScenarios(scenarioData);

      // 4. Analisar padrões de estudo
      const patternsData = await AcademicAI.analyzeStudyPatterns(userId);
      setStudyPatterns(patternsData);

      // 5. Gerar recomendações inteligentes
      const recommendationsData = await AcademicAI.generateSmartRecommendations(userId);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Erro ao carregar insights de IA:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100">
        <div className="flex items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-indigo-700 font-bold">🧠 Analisando seus dados com IA...</p>
        </div>
      </div>
    );
  }

  if (!prediction || prediction.dataQuality === 'insufficient') {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200">
        <div className="text-center">
          <Brain className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Professor IA em Treinamento</h3>
          <p className="text-gray-500">
            Continue estudando! Preciso de pelo menos 5 sessões de estudo para gerar previsões precisas.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Sessões analisadas: {prediction?.daysAnalyzed || 0}/5
          </p>
        </div>
      </div>
    );
  }

  const getTrajectoryIcon = () => {
    switch (prediction.trajectory) {
      case 'accelerating':
        return <TrendingUp className="text-green-500" size={24} />;
      case 'decelerating':
        return <TrendingDown className="text-orange-500" size={24} />;
      default:
        return <Minus className="text-blue-500" size={24} />;
    }
  };

  const getTrajectoryText = () => {
    switch (prediction.trajectory) {
      case 'accelerating':
        return { text: 'Acelerando', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      case 'decelerating':
        return { text: 'Desacelerando', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      default:
        return { text: 'Estável', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    }
  };

  const trajectoryStyle = getTrajectoryText();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
            <Brain className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Professor IA</h2>
            <p className="text-sm text-gray-500">Insights preditivos personalizados</p>
          </div>
        </div>
        
        {/* Seletor de período */}
        <div className="flex gap-2">
          {[30, 60, 90].map(days => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={clsx(
                'px-4 py-2 rounded-xl font-bold text-sm transition-all',
                selectedDays === days
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              )}
            >
              {days} dias
            </button>
          ))}
        </div>
      </div>

      {/* Botão: Otimizar Cronograma */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowScheduleModal(true)}
          className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3"
        >
          <Calendar size={24} />
          Gerar Cronograma Otimizado com IA
          <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Recomendações Inteligentes */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="text-purple-600" size={24} />
            <h3 className="text-xl font-black text-gray-800">Recomendações Inteligentes</h3>
            <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full font-bold">
              {recommendations.length} ações
            </span>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={rec.id}
                className={clsx(
                  'p-4 rounded-xl border-2 transition-all hover:shadow-md',
                  rec.priority >= 9 && 'bg-red-50 border-red-200',
                  rec.priority >= 7 && rec.priority < 9 && 'bg-orange-50 border-orange-200',
                  rec.priority >= 5 && rec.priority < 7 && 'bg-yellow-50 border-yellow-200',
                  rec.priority < 5 && 'bg-blue-50 border-blue-200'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-black text-gray-800">{idx + 1}.</span>
                      <h4 className="font-black text-gray-800">{rec.title}</h4>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    <p className="text-xs text-gray-500 italic">{rec.reasoning}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <div className="flex items-center gap-1">
                      <Target size={12} className="text-green-600" />
                      <span className="text-xs font-bold text-green-700">+{rec.estimatedImpact}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award size={12} className="text-blue-600" />
                      <span className="text-xs font-bold text-blue-700">{rec.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-white/60 rounded-xl">
            <p className="text-xs text-gray-600 text-center">
              🧠 <strong>IA Multi-Algoritmo:</strong> Combinando 6+ algoritmos para maximizar seu aprendizado
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Platô (se detectado) */}
      {plateau?.isInPlateau && (
        <div className={clsx(
          'p-6 rounded-2xl border-2',
          plateau.plateauSeverity === 'severe' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-yellow-50 border-yellow-200'
        )}>
          <div className="flex items-start gap-4">
            <div className={clsx(
              'p-3 rounded-xl',
              plateau.plateauSeverity === 'severe' ? 'bg-red-100' : 'bg-yellow-100'
            )}>
              <AlertTriangle 
                className={plateau.plateauSeverity === 'severe' ? 'text-red-600' : 'text-yellow-600'} 
                size={24} 
              />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-gray-800 mb-1">
                {plateau.plateauSeverity === 'severe' ? '🚨 Platô Severo Detectado' : '⚠️ Platô Detectado'}
              </h3>
              <p className="text-sm text-gray-700 mb-3">{plateau.suggestedAction}</p>
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-600 uppercase">Estratégias para Sair do Platô:</p>
                {plateau.breakThroughStrategies.slice(0, 3).map((strategy, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <Zap size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                    <span>{strategy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Predição */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-800">Previsão de Performance</h3>
            <div className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-full border',
              trajectoryStyle.bg,
              trajectoryStyle.border
            )}>
              {getTrajectoryIcon()}
              <span className={clsx('text-sm font-bold', trajectoryStyle.color)}>
                {trajectoryStyle.text}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Score Previsto */}
            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl">
              <p className="text-sm font-bold text-gray-600 mb-2">Em {selectedDays} dias você deve atingir:</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {prediction.predictedScore}%
                </span>
                <Target className="text-indigo-500" size={32} />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Award size={16} className="text-indigo-500" />
                <span className="text-xs font-bold text-indigo-600">
                  Confiança: {prediction.confidence}%
                </span>
              </div>
            </div>

            {/* Gargalo (se houver) */}
            {prediction.bottleneck && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-bold text-red-800">Gargalo Crítico Detectado</p>
                    <p className="text-xs text-red-600 mt-1">
                      <strong>{prediction.bottleneck}</strong> está limitando seu progresso
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Qualidade dos Dados */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Sessões analisadas: {prediction.daysAnalyzed}</span>
              <span className={clsx(
                'px-2 py-1 rounded-full font-bold',
                prediction.dataQuality === 'excellent' && 'bg-green-100 text-green-700',
                prediction.dataQuality === 'good' && 'bg-blue-100 text-blue-700',
                prediction.dataQuality === 'fair' && 'bg-yellow-100 text-yellow-700'
              )}>
                {prediction.dataQuality === 'excellent' && '✨ Excelente'}
                {prediction.dataQuality === 'good' && '👍 Bom'}
                {prediction.dataQuality === 'fair' && '⚡ Razoável'}
              </span>
            </div>
          </div>
        </div>

        {/* Card: Simulador de Cenários */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-purple-500" size={20} />
            <h3 className="text-lg font-black text-gray-800">Simulador "E se...?"</h3>
          </div>

          <div className="space-y-3">
            {scenarios.map((scenario, idx) => (
              <div 
                key={idx}
                className={clsx(
                  'p-4 rounded-xl border-2 transition-all hover:shadow-md',
                  scenario.feasibility === 'optimal' && 'bg-green-50 border-green-200',
                  scenario.feasibility === 'good' && 'bg-blue-50 border-blue-200',
                  scenario.feasibility === 'challenging' && 'bg-yellow-50 border-yellow-200',
                  scenario.feasibility === 'unrealistic' && 'bg-red-50 border-red-200'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" />
                    <span className="text-sm font-bold text-gray-800">{scenario.scenario}</span>
                  </div>
                  <span className="text-lg font-black text-gray-800">
                    {scenario.estimatedScore}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{scenario.recommendation}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-500">
                    Chance de aprovação: <strong>{scenario.estimatedAdmissionChance}%</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-600 text-center">
              💡 <strong>Dica:</strong> Ritmos entre 2-4h/dia são mais sustentáveis e eficientes
            </p>
          </div>
        </div>
      </div>

      {/* Card: Padrões de Estudo (Full Width) */}
      {studyPatterns && studyPatterns.avgSessionLength > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="text-yellow-500" size={20} />
            <h3 className="text-lg font-black text-gray-800">Seus Padrões de Estudo</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Melhor Horário */}
            <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                {studyPatterns.bestTimeOfDay.includes('Manhã') && <Sun className="text-orange-500" size={20} />}
                {studyPatterns.bestTimeOfDay.includes('Tarde') && <Sunset className="text-orange-600" size={20} />}
                {studyPatterns.bestTimeOfDay.includes('Noite') && <Moon className="text-indigo-500" size={20} />}
                <span className="text-xs font-bold text-gray-600 uppercase">Melhor Horário</span>
              </div>
              <p className="text-lg font-black text-gray-800">{studyPatterns.bestTimeOfDay}</p>
            </div>

            {/* Melhor Dia */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="text-blue-500" size={20} />
                <span className="text-xs font-bold text-gray-600 uppercase">Melhor Dia</span>
              </div>
              <p className="text-lg font-black text-gray-800">{studyPatterns.bestDayOfWeek}</p>
            </div>

            {/* Duração Ideal */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-green-500" size={20} />
                <span className="text-xs font-bold text-gray-600 uppercase">Duração Ideal</span>
              </div>
              <p className="text-lg font-black text-gray-800">{studyPatterns.optimalSessionLength}min</p>
              <p className="text-xs text-gray-500 mt-1">Média: {studyPatterns.avgSessionLength}min</p>
            </div>
          </div>

          {/* Insights */}
          {studyPatterns.insights.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-600 uppercase mb-3">Insights Personalizados:</p>
              {studyPatterns.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Zap size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-700">{insight}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Cronograma Otimizado */}
      {showScheduleModal && (
        <OptimizedSchedulePanel
          userId={userId}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
};

export default AIInsightsPanel;
