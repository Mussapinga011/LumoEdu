import { useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * Hook to track user online presence
 * Updates lastActive timestamp and isOnline status
 */
export const useOnlinePresence = () => {
  const { user } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, 'users', user.uid);

    // Mark user as online when component mounts
    const markOnline = async () => {
      try {
        await updateDoc(userRef, {
          isOnline: true,
          lastActive: serverTimestamp()
        });
      } catch (error) {
        console.error('Error marking user online:', error);
      }
    };

    // Mark user as offline
    const markOffline = async () => {
      try {
        await updateDoc(userRef, {
          isOnline: false,
          lastActive: serverTimestamp()
        });
      } catch (error) {
        console.error('Error marking user offline:', error);
      }
    };

    // Update lastActive timestamp periodically
    const updateActivity = async () => {
      const now = Date.now();
      // Only update if more than 2 minutes have passed since last update
      if (now - lastUpdateRef.current < 120000) return;
      
      lastUpdateRef.current = now;
      try {
        await updateDoc(userRef, {
          lastActive: serverTimestamp(),
          isOnline: true
        });
      } catch (error) {
        console.error('Error updating activity:', error);
      }
    };

    // Activity event listeners
    const handleActivity = () => {
      updateActivity();
    };

    // Mark online on mount
    markOnline();

    // Set up activity listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Update activity every 3 minutes
    intervalRef.current = setInterval(updateActivity, 180000);

    // Mark offline on unmount or page unload
    const handleBeforeUnload = () => {
      markOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      markOffline();
    };
  }, [user?.uid]);
};
