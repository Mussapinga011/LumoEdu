import { create } from 'zustand';
import { Discipline } from '../types/discipline';
import { University } from '../types/university';
import { getActiveDisciplines, getActiveUniversities } from '../services/dbService';
import { logger } from '../utils/logger';

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
    set({ loading: true, error: null });
    try {
      logger.dev('Fetching content (universities & disciplines)...');
      const [disciplines, universities] = await Promise.all([
        getActiveDisciplines(),
        getActiveUniversities()
      ]);
      logger.dev('Content fetched successfully:', {
        universities: universities.length,
        disciplines: disciplines.length
      });
      set({ disciplines, universities, loading: false });
    } catch (error: any) {
      logger.error('Error fetching content:', error);
      set({ error: error.message, loading: false });
    }
  },
  getDisciplinesByUniversity: (universityId: string) => {
    return get().disciplines.filter(d => d.universityId === universityId);
  }
}));
