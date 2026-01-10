import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Hook to track user online presence in Supabase
 */
export const useOnlinePresence = () => {
  const { user } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!user?.id) return;

    const markStatus = async (online: boolean) => {
      try {
        await supabase
          .from('user_profiles')
          .update({
            is_online: online,
            last_active: new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error marking user status:', error);
      }
    };

    const updateActivity = async () => {
      const now = Date.now();
      // Only update if more than 5 minutes have passed since last update
      if (now - lastUpdateRef.current < 300000) return;
      
      lastUpdateRef.current = now;
      await markStatus(true);
    };

    const handleActivity = () => {
      updateActivity();
    };

    // Mark online on mount
    markStatus(true);

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    intervalRef.current = setInterval(updateActivity, 300000);

    const handleBeforeUnload = () => {
      markStatus(false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      markStatus(false);
    };
  }, [user?.id]);
};
