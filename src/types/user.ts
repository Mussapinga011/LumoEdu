import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  streak: number;
  createdAt?: Timestamp;
  badges?: string[];
  
  // Premium System
  isPremium: boolean;
  premiumUntil?: Timestamp;
  
  // Daily Limits
  lastStudyDate: Timestamp | null;
  lastExamDate: Timestamp | null;
  lastChallengeDate: Timestamp | null;
  dailyExercisesCount: number;
  
  // Ranking & Stats
  examsCompleted: number;
  challengesCompleted: number;
  averageGrade: number;
  score: number;
  
  // Enhanced Profile Stats
  recentActivity?: UserActivity[];
  disciplineScores?: Record<string, number>;
  studyPlan?: StudyPlan;
  
  // Settings
  dataSaverMode?: boolean;
}

export interface UserActivity {
  id: string;
  type: 'exam' | 'challenge' | 'module';
  title: string;
  timestamp: Timestamp;
  score?: number;
  xpEarned?: number;
}

export interface StudyPlan {
  weeklySchedule: string[];
  weakTopics: string[];
  dailyGoal: number;
  createdAt: Timestamp;
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
