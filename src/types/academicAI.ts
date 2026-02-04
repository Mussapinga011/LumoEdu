/**
 * Tipos para o Sistema de IA Acadêmica
 */

export interface FuturePerformancePrediction {
  predictedScore: number;          // Score previsto em % (0-100)
  confidence: number;              // Confiança da previsão (0-100)
  trajectory: 'accelerating' | 'steady' | 'decelerating';
  bottleneck: string | null;       // Tópico bloqueando progresso
  daysAnalyzed: number;            // Quantos dias de histórico foram usados
  dataQuality: 'excellent' | 'good' | 'fair' | 'insufficient';
}

export interface LearningPlateauDetection {
  isInPlateau: boolean;
  plateauDuration: number;         // Dias consecutivos sem evolução
  lastSignificantImprovement: Date | null;
  suggestedAction: string;
  breakThroughStrategies: string[];
  plateauSeverity: 'mild' | 'moderate' | 'severe';
}

export interface StudyScenario {
  hoursPerDay: number;
  days: number;
}

export interface ScenarioSimulation {
  scenario: string;                // Descrição legível
  estimatedScore: number;          // Score final estimado
  estimatedAdmissionChance: number; // Chance de aprovação (0-100)
  recommendation: string;          // Feedback sobre o cenário
  feasibility: 'optimal' | 'good' | 'challenging' | 'unrealistic';
}

export interface LinearRegressionResult {
  slope: number;                   // Inclinação (taxa de melhoria por dia)
  intercept: number;               // Intercepto
  rSquared: number;                // Coeficiente de determinação (0-1)
  prediction: (x: number) => number; // Função para prever Y dado X
}

export interface StudyPattern {
  bestTimeOfDay: string;           // "Manhã", "Tarde", "Noite"
  bestDayOfWeek: string;           // "Segunda", "Terça", etc
  avgSessionLength: number;        // Minutos
  optimalSessionLength: number;    // Minutos (quando performance é máxima)
  fatiguePoint: number;            // Minutos até queda de performance
  insights: string[];              // Insights acionáveis
}

export interface OptimizedSchedule {
  schedule: DailySchedule[];
  expectedFinalScore: number;
  weaknessesAddressed: number;
  totalStudyHours: number;
}

export interface DailySchedule {
  day: string;                     // "Segunda, 10/02"
  date: Date;
  sessions: StudySession[];
}

export interface StudySession {
  time: string;                    // "08:00"
  topicId: string;
  topicName: string;
  duration: number;                // Minutos
  expectedGain: number;            // % de melhoria esperada
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface SmartRecommendation {
  id: string;
  type: 'urgent' | 'review' | 'practice' | 'theory' | 'rest';
  title: string;
  description: string;
  reasoning: string;               // Por que essa recomendação?
  priority: number;                // 1-10
  estimatedImpact: number;         // % de melhoria esperada
  confidence: number;              // % de confiança (0-100)
  actionUrl?: string;              // Link para executar a ação
}
