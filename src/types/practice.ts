import { Timestamp } from 'firebase/firestore';

export interface PracticeDiscipline {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  createdAt: Timestamp;
}

export interface PracticeSession {
  id: string;
  disciplineId: string;
  title: string;
  order: number;
  level: number;
  description: string;
  quizIds: string[]; // Reference to questions
  xpReward: number;
  createdAt: Timestamp;
}

export interface PracticeQuestion {
  id: string;
  sessionId: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  type: 'multiple_choice' | 'boolean';
  xp: number;
  createdAt: Timestamp;
}

export interface UserSessionProgress {
  sessionId: string;
  disciplineId: string;
  completed: boolean;
  score: number;
  xpEarned: number;
  streak: number;
  lastActive: Timestamp;
}
