import { create } from 'zustand';
import { AuthState, UserProfile } from '../types/user';
import { supabase } from '../lib/supabase';
import { getUserById } from '../services/dbService.supabase';
import { loadProfileCache, saveProfileCache, clearAllProfileCaches } from '../utils/profileCache';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  setUser: (user: UserProfile | null) => set({ user }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  updateUser: (updates: Partial<UserProfile>) => 
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null
    })),
  initAuth: async () => {
    console.log("🔐 useAuthStore: Initializing Auth System...");
    
    // Configurar o listener de eventos de autenticação
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 Auth event: ${event}`);
      const supabaseUser = session?.user;

      if (!supabaseUser) {
        console.log("👤 No active session");
        clearAllProfileCaches(); // Limpar todos os caches de perfil ao fazer logout
        set({ user: null, loading: false });
        return;
      }

      set({ loading: true });
      console.log("👤 User logged in, loading profile...");

      try {
        // 1. Tentar carregar do cache primeiro (instantâneo)
        const cachedProfile = loadProfileCache(supabaseUser.id);
        if (cachedProfile) {
          console.log("⚡ Using cached profile (instant load)");
          set({ user: { ...cachedProfile, email: supabaseUser.email || '' }, loading: false });
        }
        
        // 2. Buscar do banco em segundo plano (atualizar cache)
        console.log("🔄 Fetching fresh profile from database...");
        const profilePromise = getUserById(supabaseUser.id);
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 10000)
        );

        try {
          const userProfile = await Promise.race([profilePromise, timeoutPromise]);
          
          if (userProfile) {
            console.log("✅ Profile loaded from database!");
            const fullProfile = { ...userProfile, email: supabaseUser.email || '' };
            saveProfileCache(supabaseUser.id, fullProfile);
            set({ user: fullProfile, loading: false });
          } else {
            console.error("❌ getUserById returned null");
            if (cachedProfile) return; // Mantém o cache se o banco falhar
            
            // Fallback usando metadados da sessão (se existirem)
            const roleFromMetadata = supabaseUser.user_metadata?.role || 'user';
            const sessionFallback: UserProfile = {
              uid: supabaseUser.id,
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              displayName: supabaseUser.user_metadata?.displayName || supabaseUser.email?.split('@')[0] || 'Usuário',
              role: roleFromMetadata,
              isPremium: !!supabaseUser.user_metadata?.isPremium,
              streak: 0,
              examsCompleted: 0,
              challengesCompleted: 0,
              averageGrade: 0,
              dailyExercisesCount: 0,
              lastActive: new Date(),
              lastStudyDate: null,
              lastExamDate: null,
              lastChallengeDate: null,
              badges: [],
              recentActivity: []
            };
            console.warn(`⚠️ Using session metadata fallback (Role: ${roleFromMetadata})`);
            set({ user: sessionFallback, loading: false });
          }
        } catch (timeoutError) {
          console.error("⏱️ Timeout in background fetch:", timeoutError);
          if (cachedProfile) {
            set({ loading: false });
            return;
          }
          
          // Fallback de emergência usando metadados
          const roleFromMetadata = supabaseUser.user_metadata?.role || 'user';
          const sessionFallback: UserProfile = {
            uid: supabaseUser.id,
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            displayName: supabaseUser.user_metadata?.displayName || 'Usuário',
            role: roleFromMetadata,
            isPremium: false,
            streak: 0,
            examsCompleted: 0,
            challengesCompleted: 0,
            averageGrade: 0,
            dailyExercisesCount: 0,
            lastActive: new Date(),
            lastStudyDate: null,
            lastExamDate: null,
            lastChallengeDate: null,
            badges: [],
            recentActivity: []
          };
          set({ user: sessionFallback, loading: false });
        }
      } catch (error) {
        console.error("useAuthStore: Error in auth logic:", error);
        set({ loading: false });
      }
    });

    // Verificação inicial rápida
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      set({ loading: false });
    }
  }
}));
