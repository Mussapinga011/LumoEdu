import { useState, useEffect } from 'react';
import { ABTest, ABTestLocation, ABTestVariant } from '../types/abTest';
import { 
  getActiveTest, 
  getTestVariant, 
  trackTestView, 
  trackTestClick 
} from '../services/abTestService';
import { useAuthStore } from '../stores/useAuthStore';

interface UseABTestResult {
  test: ABTest | null;
  variant: 'A' | 'B';
  content: ABTestVariant | null;
  loading: boolean;
  trackClick: () => Promise<void>;
}

/**
 * Hook para usar testes A/B em componentes
 * 
 * @param location - Localização do teste (ex: 'challenge_limit_screen')
 * @param autoTrackView - Se deve rastrear visualização automaticamente (default: true)
 * 
 * @example
 * const { content, trackClick } = useABTest('challenge_limit_screen');
 * 
 * if (content) {
 *   return (
 *     <div>
 *       <h2>{content.title}</h2>
 *       <p>{content.message}</p>
 *       <button onClick={trackClick}>{content.buttonText}</button>
 *     </div>
 *   );
 * }
 */
export const useABTest = (
  location: ABTestLocation,
  autoTrackView: boolean = true
): UseABTestResult => {
  const { user } = useAuthStore();
  const [test, setTest] = useState<ABTest | null>(null);
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [loading, setLoading] = useState(true);
  const [viewTracked, setViewTracked] = useState(false);

  useEffect(() => {
    const loadTest = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const activeTest = await getActiveTest(location);
        
        if (activeTest) {
          setTest(activeTest);
          const userVariant = getTestVariant(user.uid, activeTest.id);
          setVariant(userVariant);

          // Rastrear visualização automaticamente
          if (autoTrackView && !viewTracked) {
            await trackTestView(activeTest.id, userVariant);
            setViewTracked(true);
          }
        }
      } catch (error) {
        console.error('Error loading AB test:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [location, user, autoTrackView, viewTracked]);

  const trackClick = async () => {
    if (test && user) {
      await trackTestClick(test.id, variant);
    }
  };

  const content = test 
    ? (variant === 'A' ? test.variantA : test.variantB)
    : null;

  return {
    test,
    variant,
    content,
    loading,
    trackClick
  };
};
