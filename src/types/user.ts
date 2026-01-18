// Retirado Timestamp do firebase para compatibilidade com Supabase

export interface UserProfile {
  uid: string;
  id: string; // Alias para uid usado no Supabase
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  streak: number;
  createdAt?: any;
  badges?: string[];
  
  // Premium System
  isPremium: boolean;
  premiumUntil?: any;
  
  // Daily Limits
  lastStudyDate: any | null;
  lastExamDate: any | null;
  lastChallengeDate: any | null;
  dailyExercisesCount: number;
  
  // Ranking & Stats
  examsCompleted: number;
  challengesCompleted: number;
  averageGrade: number;
  
  // Enhanced Profile Stats
  recentActivity?: UserActivity[];
  disciplineScores?: Record<string, number>;
  studyPlan?: StudyPlan;
  
  // Settings
  dataSaverMode?: boolean;
  
  // Online Presence
  lastActive?: any;
  isOnline?: boolean;
}

export interface UserActivity {
  id: string;
  type: 'exam' | 'challenge' | 'module' | 'consistency_bonus';
  title: string;
  timestamp: any;
  score?: number;
}

export interface StudyPlan {
  targetCourse?: string; // e.g., 'Engenharia Informática'
  targetUniversity?: string; // e.g., 'UEM'
  subjects: string[]; // IDs das disciplinas nucleares (ex: ['math', 'physics'])
  weeklySchedule: string[];
  weakTopics: string[];
  dailyGoal: number;
  startDate: string; // ISO Date
  createdAt: any;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  initAuth: () => void;
}
