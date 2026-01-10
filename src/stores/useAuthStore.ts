import { create } from 'zustand';
import { AuthState, UserProfile } from '../types/user';
import { supabase } from '../lib/supabase';
import { getUserById } from '../services/dbService.supabase';

export const useAuthStore = create<AuthState>((set, get) => ({
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
    console.log("useAuthStore: Initializing Auth System...");
    
    // Configurar o listener de eventos de autenticação
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`useAuthStore: Event detected -> ${event}`);
      const supabaseUser = session?.user;

      if (!supabaseUser) {
        console.log("useAuthStore: No active session.");
        set({ user: null, loading: false });
        return;
      }

      set({ loading: true });
      console.log("useAuthStore: User logged in, trying to load profile...");

      try {
        console.log("useAuthStore: Attempting to load profile from database...");
        
        // Tenta buscar o perfil real com timeout de 10 segundos
        const profilePromise = getUserById(supabaseUser.id);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject('timeout'), 10000)
        );

        try {
          const userProfile = await Promise.race([profilePromise, timeoutPromise]) as UserProfile | null;
          
          if (userProfile) {
            console.log("✅ useAuthStore: Profile loaded successfully from Database!");
            console.log("Role:", userProfile.role, "| Premium:", userProfile.isPremium);
            set({ user: { ...userProfile, email: supabaseUser.email || '' }, loading: false });
          } else {
            console.error("❌ useAuthStore: getUserById returned null");
            // Criar fallback apenas se realmente não encontrar
            const sessionFallback: UserProfile = {
              uid: supabaseUser.id,
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'Usuário',
              role: 'user',
              isPremium: false,
              level: 1,
              xp: 0,
              streak: 0,
              score: 0,
              badges: [],
              recentActivity: []
            };
            console.warn("⚠️ Using session fallback");
            set({ user: sessionFallback, loading: false });
          }
        } catch (err) {
          console.error("❌ useAuthStore: Error or timeout:", err);
          // Fallback em caso de erro
          const sessionFallback: UserProfile = {
            uid: supabaseUser.id,
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'Usuário',
            role: 'user',
            isPremium: false,
            level: 1,
            xp: 0,
            streak: 0,
            score: 0,
            badges: [],
            recentActivity: []
          };
          set({ user: sessionFallback, loading: false });
        }
      } catch (error) {
        console.error("useAuthStore: Fatal error in auth logic:", error);
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
