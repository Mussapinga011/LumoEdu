export type SimulationMode = 'standard' | 'timed' | 'exam' | 'custom' | string;

export interface SimulationConfig {
  disciplineId?: string | 'all';
  disciplineIds?: string[];
  universityId?: string | 'all';
  university?: string; 
  includeAllDisciplines?: boolean;
  questionCount: 10 | 20 | 30 | 40 | 50 | 60;
  timeLimit?: number; // in minutes
  mode?: SimulationMode;
}

export interface SimulationQuestion {
  id: string;
  examId: string;
  examName: string;
  disciplineId: string;
  disciplineName: string;
  statement: string;
  options: string[];
  correctOption: string;
  explanation?: string;
  difficulty?: number;
  userPreviouslyAnswered: boolean;
  userPreviouslyCorrect: boolean;
}

export interface SimulationResult {
  id: string;
  userId: string;
  config: SimulationConfig;
  score: number;
  correctAnswers?: number; // Legacy
  correctCount: number; // New standard
  totalQuestions: number;
  timeSpent: number; // in seconds
  answers: Record<string, string>;
  createdAt: any;
}
