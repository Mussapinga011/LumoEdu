import { create } from 'zustand';
import { 
  StudentAcademicProfile, 
  PerformanceAnalysis, 
  ContentRecommendation, 
  DailyGoal, 
  KnowledgeGap 
} from '../types/academicTracking';
import { AcademicTrackingService } from '../services/academicTrackingService';

interface TrackingState {
  profile: StudentAcademicProfile | null;
  analysis: PerformanceAnalysis | null;
  recommendations: ContentRecommendation[];
  dailyGoal: DailyGoal | null;
  knowledgeGaps: KnowledgeGap[];
  lastFetched: number | null;
  isLoading: boolean;
  
  // Actions
  fetchDashboardData: (userId: string, forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  profile: null,
  analysis: null,
  recommendations: [],
  dailyGoal: null,
  knowledgeGaps: [],
  lastFetched: null,
  isLoading: false,

  fetchDashboardData: async (userId: string, forceRefresh = false) => {
    const { lastFetched, isLoading } = get();
    
    // Evitar fetch duplicado se já estiver carregando
    if (isLoading) return;

    // Se já temos dados e foram buscados há menos de 5 minutos, não busca de novo de forma bloqueante
    // A menos que seja um forceRefresh
    const isCacheValid = lastFetched && (Date.now() - lastFetched < 5 * 60 * 1000);
    
    if (isCacheValid && !forceRefresh) return;

    set({ isLoading: true });

    try {
      const [profileData, analysisData, recsData, goalData, gapsData] = await Promise.all([
        AcademicTrackingService.getStudentProfile(userId),
        AcademicTrackingService.analyzePerformance(userId),
        AcademicTrackingService.getRecommendations(userId),
        AcademicTrackingService.getDailyGoal(userId),
        AcademicTrackingService.identifyKnowledgeGaps(userId)
      ]);

      set({
        profile: profileData,
        analysis: analysisData,
        recommendations: recsData,
        dailyGoal: goalData,
        knowledgeGaps: gapsData,
        lastFetched: Date.now(),
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      set({ isLoading: false });
    }
  },

  clearCache: () => {
    set({
      profile: null,
      analysis: null,
      recommendations: [],
      dailyGoal: null,
      knowledgeGaps: [],
      lastFetched: null
    });
  }
}));
