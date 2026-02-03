import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useTrackingStore } from '../stores/useTrackingStore';
import { AcademicTrackingService } from '../services/academicTrackingService';
import type {
  ContentRecommendation,
  KnowledgeGap
} from '../types/academicTracking';
import {
  Target,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame,
  BookOpen,
  Brain,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const { 
    profile, 
    analysis, 
    recommendations, 
    dailyGoal, 
    knowledgeGaps, 
    fetchDashboardData,
    isLoading: storeLoading,
    lastFetched
  } = useTrackingStore();

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData(user.id);
    }
  }, [user, fetchDashboardData]);

  // Mostrar loading apenas se NÃO houver dados em cache
  // Se houver dados (lastFetched), permite ver os dados antigos enquanto atualiza
  const showInitialLoading = storeLoading && !lastFetched;

  if (showInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Analisando seu progresso...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <Brain className="mx-auto text-gray-300 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Configure seu Plano de Estudos</h2>
        <p className="text-gray-500 mb-6">Defina sua meta para começar o acompanhamento inteligente.</p>
        <button
          onClick={() => navigate('/study-plan/setup')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
        >
          Configurar Agora
        </button>
      </div>
    );
  }

  const daysUntilExam = profile.admissionExamDate
    ? Math.ceil((profile.admissionExamDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* HEADER: Meta e Progresso Geral */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black mb-2">Seu Caminho para {profile.targetUniversity}</h1>
              <p className="text-indigo-100 font-medium">{profile.targetCourse} • Turma {profile.targetYear}</p>
            </div>
            {daysUntilExam && (
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/30">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-1">Faltam</div>
                <div className="text-4xl font-black">{daysUntilExam}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-100">dias</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Target size={24} />}
              label="Prontidão"
              value={`${analysis?.readinessScore || 0}%`}
              color="bg-green-500"
            />
            <StatCard
              icon={<TrendingUp size={24} />}
              label="Chance de Aprovação"
              value={`${analysis?.estimatedAdmissionChance || 0}%`}
              color="bg-blue-500"
            />
            <StatCard
              icon={<Flame size={24} />}
              label="Sequência"
              value={`${profile.currentStreak} dias`}
              color="bg-orange-500"
            />
            <StatCard
              icon={<Clock size={24} />}
              label="Tempo Total"
              value={`${Math.round(profile.totalStudyTime / 60)}h`}
              color="bg-purple-500"
            />
          </div>
        </div>
      </div>

      {/* META DIÁRIA */}
      {dailyGoal && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="text-indigo-600" size={24} />
              Meta de Hoje
            </h2>
            <span className={clsx(
              "px-3 py-1 rounded-full text-xs font-bold uppercase",
              dailyGoal.isCompleted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            )}>
              {dailyGoal.isCompleted ? "✓ Concluída" : `${dailyGoal.completionRate}%`}
            </span>
          </div>

          <div className="space-y-3">
            <GoalProgress
              label="Questões Resolvidas"
              current={0}
              target={dailyGoal.questionsToSolve}
              icon={<BookOpen size={16} />}
            />
            <GoalProgress
              label="Tempo de Estudo"
              current={0}
              target={dailyGoal.minutesToStudy}
              unit="min"
              icon={<Clock size={16} />}
            />
          </div>
        </div>
      )}

      {/* RECOMENDAÇÕES INTELIGENTES */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="text-yellow-500" size={24} />
            Recomendações Personalizadas
          </h2>

          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* LACUNAS DE CONHECIMENTO */}
      {knowledgeGaps.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={24} />
            Áreas para Fortalecer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeGaps.slice(0, 4).map((gap) => (
              <GapCard key={gap.topicId} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* ANÁLISE DE PERFORMANCE */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pontos Fortes */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-green-600" size={20} />
              Seus Pontos Fortes
            </h3>
            <div className="space-y-2">
              {analysis.strengths.slice(0, 3).map((strength, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/60 p-3 rounded-xl">
                  <span className="font-medium text-gray-700">{strength.topicName || 'Tópico'}</span>
                  <span className="font-bold text-green-600">{strength.score}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pontos Fracos */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="text-orange-600" size={20} />
              Precisa de Atenção
            </h3>
            <div className="space-y-2">
              {analysis.weaknesses.slice(0, 3).map((weakness, idx) => (
                <div key={idx} className="bg-white/60 p-3 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700">{weakness.topicName || 'Tópico'}</span>
                    <span className="font-bold text-orange-600">{weakness.score}%</span>
                  </div>
                  <p className="text-xs text-gray-500">{weakness.recommendedAction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INSIGHTS */}
      {analysis && analysis.insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Insights</h3>
          <div className="space-y-2">
            {analysis.insights.map((insight, idx) => (
              <p key={idx} className="text-gray-700 font-medium">{insight}</p>
            ))}
          </div>
        </div>
      )}

      {/* HISTÓRICO DE ATIVIDADES (NOVO) */}
      <RecentHistorySection userId={user?.id || ''} />
    </div>
  );
};

// ============================================
// SUB-COMPONENTES
// ============================================

const RecentHistorySection = ({ userId }: { userId: string }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      AcademicTrackingService.getPerformanceHistory(userId, 7).then(data => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [userId]);

  if (loading) return <div className="text-center py-4 text-gray-400">Carregando histórico...</div>;
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Clock className="text-gray-500" size={24} />
        Histórico Recente
      </h3>
      <div className="space-y-3">
        {history.map((record) => (
          <div key={record.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {record.score >= 70 ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <p className="font-bold text-gray-800">{record.disciplineName || 'Estudo Geral'}</p>
                <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString('pt-BR')} • {record.timeSpent} min</p>
              </div>
            </div>
            <div className="text-right">
              <p className={clsx("font-black text-lg", record.score >= 70 ? "text-green-600" : "text-orange-500")}>
                {record.score}%
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Acerto</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
    <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <div className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-1">{label}</div>
    <div className="text-2xl font-black">{value}</div>
  </div>
);

const GoalProgress = ({ label, current, target, unit = '', icon }: any) => {
  const percentage = Math.min(100, Math.round((current / target) * 100));
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="text-sm font-bold text-gray-600">
          {current} / {target} {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const RecommendationCard = ({ recommendation }: { recommendation: ContentRecommendation }) => {
  const priorityColors = {
    urgent: 'border-red-200 bg-red-50',
    high: 'border-orange-200 bg-orange-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-gray-200 bg-gray-50'
  };

  const priorityIcons = {
    urgent: '🚨',
    high: '⚠️',
    medium: '💡',
    low: 'ℹ️'
  };

  return (
    <div className={clsx(
      "p-4 rounded-xl border-2 transition-all hover:shadow-md",
      priorityColors[recommendation.priority]
    )}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{priorityIcons[recommendation.priority]}</span>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800 mb-1">{recommendation.content.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{recommendation.reason}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {recommendation.content.estimatedTime} min
            </span>
            <span className="font-bold text-indigo-600">
              Impacto: {recommendation.expectedImpact}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const GapCard = ({ gap }: { gap: KnowledgeGap }) => {
  const priorityColors = {
    urgent: 'border-red-300 bg-red-50',
    high: 'border-orange-300 bg-orange-50',
    medium: 'border-yellow-300 bg-yellow-50',
    low: 'border-gray-300 bg-gray-50'
  };

  return (
    <div className={clsx(
      "p-4 rounded-xl border-2",
      priorityColors[gap.priority]
    )}>
      <h4 className="font-bold text-gray-800 mb-2">{gap.topicName}</h4>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Severidade: {gap.severity}%</span>
        <span className="text-gray-600">{gap.estimatedTimeToFix}h para corrigir</span>
      </div>
    </div>
  );
};

export default StudentDashboard;
