import { create } from 'zustand';
import { Discipline } from '../types/discipline';
import { University } from '../types/university';
import { getAllDisciplines, getAllUniversities } from '../services/contentService.supabase';


interface ContentState {
  disciplines: Discipline[];
  universities: University[];
  loading: boolean;
  error: string | null;
  fetchContent: () => Promise<void>;
  getDisciplinesByUniversity: (universityId: string) => Discipline[];
}

export const useContentStore = create<ContentState>((set, get) => ({
  disciplines: [],
  universities: [],
  loading: false,
  error: null,
  fetchContent: async () => {
    // Se já tiver dados, não carregar de novo
    if (get().disciplines.length > 0) {
      set({ loading: false });
      return;
    }

    if (get().loading) return;

    set({ loading: true, error: null });
    
    // Timeout de segurança: Se em 10 segundos não carregar, libera o loading
    const timeoutId = setTimeout(() => {
      if (get().loading) {
        console.warn('useContentStore: Fetching timed out after 10s');
        set({ loading: false, error: 'Tempo de carregamento excedido' });
      }
    }, 10000);

    try {
      console.log('useContentStore: Start fetching...');
      
      const [disciplinesResult, universitiesResult] = await Promise.all([
        getAllDisciplines().catch(e => { console.error('Error in getAllDisciplines:', e); return []; }),
        getAllUniversities().catch(e => { console.error('Error in getAllUniversities:', e); return []; })
      ]);
      
      clearTimeout(timeoutId);
      console.log(`useContentStore: Success! Found ${disciplinesResult.length} disciplines and ${universitiesResult.length} universities`);

      const mappedDisciplines: Discipline[] = (disciplinesResult || []).map(d => ({
        id: d.id,
        title: d.title,
        icon: d.icon,
        color: d.color,
        universityId: d.university_id || undefined,
        isActive: d.is_active
      }));

      const mappedUniversities: University[] = (universitiesResult || []).map(u => ({
        id: u.id,
        name: u.name,
        shortName: u.short_name,
        isActive: u.is_active !== false
      }));

      set({ 
        disciplines: mappedDisciplines, 
        universities: mappedUniversities, 
        loading: false,
        error: null
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('useContentStore: Fatal error during fetch:', error);
      set({ 
        error: error.message || 'Erro ao carregar conteúdo', 
        loading: false 
      });
    }
  },
  getDisciplinesByUniversity: (universityId: string) => {
    return get().disciplines.filter(d => d.universityId === universityId);
  }
}));
