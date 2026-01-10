export interface PracticeSession {
  id: string;
  disciplineId: string;
  title: string;
  description: string;
  orderIndex: number;
  isActive: boolean;
  createdAt?: any;
}

export interface PracticeSection {
  id: string;
  sessionId: string;
  title: string;
  description?: string; // Added for compatibility
  content: string; // Markdown support
  orderIndex: number;
  isActive: boolean;
  createdAt?: any;
}

export interface PracticeQuestion {
  id: string;
  sessionId: string;
  statement: string;
  question?: string; // Alias for statement
  options: string[];
  correctOption: number;
  correctAnswer?: number; // Alias for correctOption
  explanation?: string;
  orderIndex: number;
  xp?: number;
  createdAt?: any;
}

export interface UserSessionProgress {
  userId: string;
  sessionId: string;
  completed: boolean;
  score?: number;
  completedSections: string[];
  completedQuestions: string[];
  lastAccessed: any;
}
