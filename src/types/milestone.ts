export type MilestoneRequirementType = 'questions_count' | 'exams_completed' | 'average_score' | 'syllabus_coverage' | 'simulation_count' | 'study_streak';

export interface MilestoneRequirement {
  type: MilestoneRequirementType;
  value: number;
  disciplineId?: string; // Se omitido, é geral. Se for 'dynamic_plan', depende do plano de estudo.
}

export type MilestoneCategory = 'syllabus' | 'simulation' | 'performance' | 'consistency';

export interface PreparationMilestone {
  id: string;
  category: MilestoneCategory;
  name: string; 
  description: string; 
  icon: string; 
  requirement: MilestoneRequirement;
}

export interface UserMilestone {
  userId: string;
  milestoneId: string;
  achievedAt: Date;
}

// Definição dos Marcos Oficiais de Preparação
export const PREPARATION_MILESTONES: PreparationMilestone[] = [
  // 1. Cobertura de Conteúdo (Syllabus) - Genérico para disciplinas do plano
  {
    id: 'syllabus_base_1',
    category: 'syllabus',
    name: 'Base da Disciplina Nuclear I',
    description: 'Respondeu a 100 questões da sua 1ª disciplina principal.',
    icon: 'Calculator',
    requirement: { type: 'questions_count', value: 100, disciplineId: 'dynamic_subject_1' }
  },
  {
    id: 'syllabus_base_2',
    category: 'syllabus',
    name: 'Base da Disciplina Nuclear II',
    description: 'Respondeu a 100 questões da sua 2ª disciplina principal.',
    icon: 'Book',
    requirement: { type: 'questions_count', value: 100, disciplineId: 'dynamic_subject_2' }
  },

  // 2. Consistência em Simulados (Prontidão Real)
  {
    id: 'sim_initiate',
    category: 'simulation',
    name: 'Início da Jornada de Testes',
    description: 'Completou o primeiro simulado integral.',
    icon: 'Flag',
    requirement: { type: 'simulation_count', value: 1 }
  },
  {
    id: 'sim_consistency',
    category: 'simulation',
    name: 'Rotina de Exame',
    description: 'Realizou 5 simulados completos.',
    icon: 'Repeat',
    requirement: { type: 'simulation_count', value: 5 }
  },

  // 3. Performance / Prontidão Crítica
  {
    id: 'readiness_foundational',
    category: 'performance',
    name: 'Nível de Aprovação: Básico',
    description: 'Mantém média acima de 50% em simulados.',
    icon: 'BarChart3',
    requirement: { type: 'average_score', value: 50 }
  },
  {
    id: 'readiness_competitive',
    category: 'performance',
    name: 'Nível de Aprovação: Competitivo',
    description: 'Mantém média acima de 75% em simulados.',
    icon: 'TrendingUp',
    requirement: { type: 'average_score', value: 75 }
  },
  
  // 4. Consistência de Estudo
  {
    id: 'study_habit_formed',
    category: 'consistency',
    name: 'Hábito de Estudo Consolidado',
    description: 'Concluiu 50 sessões ou exames.',
    icon: 'CalendarCheck',
    requirement: { type: 'exams_completed', value: 50 }
  }
];
