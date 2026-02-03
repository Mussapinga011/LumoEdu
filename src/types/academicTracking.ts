// ============================================
// TIPOS PARA SISTEMA DE ACOMPANHAMENTO INTELIGENTE
// ============================================

/**
 * Nível de conhecimento do estudante em uma disciplina
 */
export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Status de um tópico no progresso do estudante
 */
export type TopicStatus = 'not-started' | 'in-progress' | 'completed' | 'mastered';

/**
 * Tipo de recomendação do sistema
 */
export type RecommendationType = 'theory' | 'practice' | 'exam' | 'review';

/**
 * Prioridade de uma recomendação
 */
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';

// ============================================
// PERFIL ACADÊMICO DO ESTUDANTE
// ============================================

/**
 * Avaliação de nível em uma disciplina específica
 */
export interface DisciplineAssessment {
  knowledgeLevel: KnowledgeLevel;
  lastAssessment: Date;
  score: number; // 0-100
  questionsAnswered: number;
  correctAnswers: number;
}

/**
 * Registro de performance histórica
 */
export interface PerformanceRecord {
  id: string;
  userId: string;
  date: Date;
  disciplineId: string;
  disciplineName: string;
  score: number; // 0-100
  questionsAnswered: number;
  correctAnswers: number;
  timeSpent: number; // minutos
  topicsStudied: string[];
}

/**
 * Perfil acadêmico completo do estudante
 */
export interface StudentAcademicProfile {
  userId: string;
  
  // Meta de Admissão
  targetUniversity: string;
  targetCourse: string;
  targetYear: number;
  admissionExamDate?: Date;
  
  // Nível Atual por Disciplina
  currentLevel: {
    [disciplineId: string]: DisciplineAssessment;
  };
  
  // Progresso de Conteúdo
  completedSections: string[];   // IDs de seções concluídas
  completedSessions: string[];   // IDs de sessões concluídas
  masteredTopics: string[];      // IDs de tópicos dominados (>90%)
  weakTopics: string[];          // IDs de tópicos fracos (<60%)
  
  // Histórico de Performance
  performanceHistory: PerformanceRecord[];
  
  // Estatísticas Gerais
  totalStudyTime: number;        // minutos
  totalQuestionsAnswered: number;
  overallAccuracy: number;       // 0-100
  currentStreak: number;         // dias consecutivos
  longestStreak: number;
  
  // Última atualização
  lastUpdated: Date;
}

// ============================================
// REQUISITOS DE CURSO
// ============================================

/**
 * Peso de uma disciplina em um curso
 */
export interface DisciplineWeight {
  disciplineId: string;
  disciplineName: string;
  weight: number; // 0-1 (ex: 0.4 = 40%)
  isRequired: boolean;
}

/**
 * Requisitos de um curso universitário
 */
export interface CourseRequirements {
  id: string;
  universityId: string;
  universityName: string;
  courseName: string;
  disciplines: DisciplineWeight[];
  minimumScore: number; // Score mínimo geral
  estimatedStudyHours: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CONTEÚDO PROGRAMÁTICO (SYLLABUS)
// ============================================

/**
 * Importância de um tópico
 */
export type TopicImportance = 1 | 2 | 3 | 4 | 5; // 1=crítico, 5=opcional

/**
 * Tópico do conteúdo programático
 */
export interface SyllabusTopic {
  id: string;
  disciplineId: string;
  disciplineName: string;
  universityId?: string;
  courseName?: string;
  
  topicName: string;
  subtopics: string[];
  description?: string;
  
  importance: TopicImportance;
  estimatedHours: number;
  orderIndex: number;
  
  // Pré-requisitos
  prerequisites: string[]; // IDs de tópicos que devem ser estudados antes
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Progresso do estudante em um tópico
 */
export interface TopicProgress {
  topicId: string;
  userId: string;
  status: TopicStatus;
  score: number; // 0-100
  questionsAnswered: number;
  correctAnswers: number;
  timeSpent: number; // minutos
  topic?: any;
  lastStudied?: Date;
  completedAt?: Date;
}

// ============================================
// SISTEMA DE RECOMENDAÇÃO
// ============================================

/**
 * Recomendação de conteúdo do sistema
 */
export interface ContentRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  
  content: {
    id: string;
    title: string;
    discipline: string;
    topicId?: string;
    estimatedTime: number; // minutos
    difficulty: number; // 1-5
  };
  
  reason: string; // Explicação da recomendação
  expectedImpact: number; // 0-100 (quanto vai ajudar)
  
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Plano de estudos semanal
 */
export interface WeeklyStudyPlan {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  
  dailyPlans: {
    dayOfWeek: string;
    date: Date;
    sessions: {
      time: string; // "09:00"
      duration: number; // minutos
      disciplineId: string;
      topicId: string;
      type: 'theory' | 'practice' | 'review';
      description: string;
    }[];
    dailyGoal: {
      questionsToSolve: number;
      minutesToStudy: number;
      topicsToComplete: string[];
    };
  }[];
  
  weeklyGoals: {
    totalStudyTime: number;
    topicsToMaster: string[];
    examsToComplete: string[];
  };
}

// ============================================
// ANÁLISE DE PERFORMANCE
// ============================================

/**
 * Análise de desempenho do estudante
 */
export interface PerformanceAnalysis {
  userId: string;
  analyzedAt: Date;
  
  // Scores Gerais
  overallScore: number; // 0-100
  disciplineScores: {
    [disciplineId: string]: number;
  };
  
  // Tendências
  trend: 'improving' | 'stable' | 'declining';
  improvementRate: number; // % de melhoria por semana
  
  // Predições
  readinessScore: number; // 0-100 (pronto para o exame?)
  estimatedAdmissionChance: number; // 0-100 (%)
  daysUntilReady: number;
  
  // Pontos Fortes e Fracos
  strengths: {
    topicId: string;
    topicName: string;
    score: number;
  }[];
  
  weaknesses: {
    topicId: string;
    topicName: string;
    score: number;
    recommendedAction: string;
  }[];
  
  // Padrões de Erro
  commonMistakes: {
    type: string;
    frequency: number;
    examples: string[];
  }[];
  
  // Insights
  insights: string[];
  recommendations: string[];
}

/**
 * Lacuna de conhecimento identificada
 */
export interface KnowledgeGap {
  topicId: string;
  topicName: string;
  disciplineId: string;
  priority: RecommendationPriority;
  severity: number; // 0-100 (quanto está prejudicando)
  estimatedTimeToFix: number; // horas
  recommendedContent: string[];
}

// ============================================
// GAMIFICAÇÃO E CONQUISTAS
// ============================================

/**
 * Tipo de conquista
 */
export type AchievementType = 
  | 'streak'
  | 'questions_solved'
  | 'topic_mastered'
  | 'exam_completed'
  | 'perfect_score'
  | 'study_time'
  | 'consistency';

/**
 * Conquista desbloqueada
 */
export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress: number; // 0-100
  isCompleted: boolean;
}

/**
 * Meta diária adaptativa
 */
export interface DailyGoal {
  date: Date;
  questionsToSolve: number;
  minutesToStudy: number;
  topicsToReview: string[];
  isCompleted: boolean;
  completionRate: number; // 0-100
}
