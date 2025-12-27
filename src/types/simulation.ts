import { Timestamp } from 'firebase/firestore';

export type SimulationMode = 
  | 'weaknesses'    // Baseado em fraquezas do usuário
  | 'revision'      // Só questões que errou
  | 'random'        // Questões aleatórias
  | 'difficult'     // Questões difíceis (que maioria erra)
  | 'custom';       // Personalizado

export interface SimulationConfig {
  mode: SimulationMode;
  questionCount: 10 | 20 | 30 | 50;
  disciplineIds: string[];
  includeAllDisciplines?: boolean;
  university?: string | 'both';
  yearRange?: {
    from: number;
    to: number;
  };
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
  difficulty?: number; // 1-5
  userPreviouslyAnswered?: boolean;
  userPreviouslyCorrect?: boolean;
}

export interface SimulationResult {
  id: string;
  userId: string;
  config: SimulationConfig;
  questions: SimulationQuestion[];
  answers: Record<string, string>; // questionId -> selectedOption
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeSpent: number; // em segundos
  completedAt: Timestamp;
  createdAt: Timestamp;
}

export interface UserQuestionHistory {
  userId: string;
  questionId: string;
  attempts: number;
  correctAttempts: number;
  lastAttempt: Timestamp;
  lastAnswer: string;
  wasCorrect: boolean;
}
