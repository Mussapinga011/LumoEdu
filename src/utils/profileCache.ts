import { UserProfile } from '../types/user';

const CACHE_DURATION = 1000 * 60 * 60; // 1 hora
const CACHE_KEY_PREFIX = 'profile_';

interface CachedProfile {
  profile: UserProfile;
  timestamp: number;
}

/**
 * Salvar perfil no cache do localStorage
 */
export const saveProfileCache = (userId: string, profile: UserProfile): void => {
  try {
    const cached: CachedProfile = {
      profile,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(cached));
    console.log('💾 Profile saved to cache');
  } catch (error) {
    console.error('Failed to save profile cache:', error);
  }
};

/**
 * Carregar perfil do cache (se não expirou)
 */
export const loadProfileCache = (userId: string): UserProfile | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
    if (!cached) return null;

    const parsed: CachedProfile = JSON.parse(cached);
    
    // Verificar se o cache expirou
    const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION;
    if (isExpired) {
      console.log('⏰ Cache expired, removing...');
      clearProfileCache(userId);
      return null;
    }

    console.log('📦 Loaded profile from cache');
    return parsed.profile;
  } catch (error) {
    console.error('Failed to load profile cache:', error);
    return null;
  }
};

/**
 * Limpar cache de perfil
 */
export const clearProfileCache = (userId: string): void => {
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
    console.log('🗑️ Profile cache cleared');
  } catch (error) {
    console.error('Failed to clear profile cache:', error);
  }
};

/**
 * Limpar todos os caches de perfil
 */
export const clearAllProfileCaches = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ All profile caches cleared');
  } catch (error) {
    console.error('Failed to clear all caches:', error);
  }
};
