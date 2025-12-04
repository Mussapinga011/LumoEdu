import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ABTest, ABTestCreate, ABTestLocation, ABTestStatus } from '../types/abTest';

const AB_TESTS_COLLECTION = 'abTests';

// Cache para testes ativos (reduz leituras do Firebase)
const testCache = new Map<string, { test: ABTest; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Buscar teste ativo para uma localização específica
 */
export const getActiveTest = async (location: ABTestLocation): Promise<ABTest | null> => {
  try {
    // Verificar cache primeiro
    const cached = testCache.get(location);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.test;
    }

    const q = query(
      collection(db, AB_TESTS_COLLECTION),
      where('location', '==', location),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      testCache.delete(location);
      return null;
    }

    const test = { 
      id: snapshot.docs[0].id, 
      ...snapshot.docs[0].data() 
    } as ABTest;

    // Atualizar cache
    testCache.set(location, { test, timestamp: Date.now() });

    return test;
  } catch (error) {
    console.error('Error fetching active test:', error);
    return null;
  }
};

/**
 * Determinar qual variante mostrar para um usuário
 * Usa hash consistente para garantir que o mesmo usuário sempre vê a mesma versão
 */
export const getTestVariant = (userId: string, testId: string): 'A' | 'B' => {
  const hash = (userId + testId).split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return hash % 2 === 0 ? 'A' : 'B';
};

/**
 * Rastrear visualização de teste
 */
export const trackTestView = async (testId: string, variant: 'A' | 'B'): Promise<void> => {
  try {
    const testRef = doc(db, AB_TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
      [`results.variant${variant}.views`]: increment(1),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error tracking test view:', error);
  }
};

/**
 * Rastrear clique no botão
 */
export const trackTestClick = async (testId: string, variant: 'A' | 'B'): Promise<void> => {
  try {
    const testRef = doc(db, AB_TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
      [`results.variant${variant}.clicks`]: increment(1),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error tracking test click:', error);
  }
};

/**
 * Rastrear conversão (compra Premium)
 */
export const trackTestConversion = async (testId: string, variant: 'A' | 'B'): Promise<void> => {
  try {
    const testRef = doc(db, AB_TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
      [`results.variant${variant}.conversions`]: increment(1),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error tracking test conversion:', error);
  }
};

/**
 * Criar novo teste A/B
 */
export const createABTest = async (
  testData: ABTestCreate, 
  userId: string
): Promise<string> => {
  try {
    const newTest = {
      ...testData,
      status: 'draft' as ABTestStatus,
      results: {
        variantA: { views: 0, clicks: 0, conversions: 0 },
        variantB: { views: 0, clicks: 0, conversions: 0 }
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId
    };

    const docRef = await addDoc(collection(db, AB_TESTS_COLLECTION), newTest);
    return docRef.id;
  } catch (error) {
    console.error('Error creating AB test:', error);
    throw error;
  }
};

/**
 * Atualizar teste existente
 */
export const updateABTest = async (
  testId: string, 
  updates: Partial<ABTest>
): Promise<void> => {
  try {
    const testRef = doc(db, AB_TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });

    // Limpar cache se status mudou
    if (updates.status || updates.location) {
      testCache.clear();
    }
  } catch (error) {
    console.error('Error updating AB test:', error);
    throw error;
  }
};

/**
 * Ativar teste
 */
export const activateTest = async (testId: string): Promise<void> => {
  try {
    const testRef = doc(db, AB_TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
      status: 'active',
      startedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    testCache.clear();
  } catch (error) {
    console.error('Error activating test:', error);
    throw error;
  }
};

/**
 * Pausar teste
 */
export const pauseTest = async (testId: string): Promise<void> => {
  try {
    const testRef = doc(db, AB_TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
      status: 'paused',
      updatedAt: Timestamp.now()
    });
    
    testCache.clear();
  } catch (error) {
    console.error('Error pausing test:', error);
    throw error;
  }
};

/**
 * Completar teste e aplicar vencedor
 */
export const completeTest = async (testId: string): Promise<void> => {
  try {
    const testRef = doc(db, AB_TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
      status: 'completed',
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    testCache.clear();
  } catch (error) {
    console.error('Error completing test:', error);
    throw error;
  }
};

/**
 * Buscar todos os testes
 */
export const getAllTests = async (): Promise<ABTest[]> => {
  try {
    const q = query(
      collection(db, AB_TESTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ABTest[];
  } catch (error) {
    console.error('Error fetching all tests:', error);
    return [];
  }
};

/**
 * Buscar teste por ID
 */
export const getTestById = async (testId: string): Promise<ABTest | null> => {
  try {
    const testRef = doc(db, AB_TESTS_COLLECTION, testId);
    const snapshot = await getDoc(testRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data()
    } as ABTest;
  } catch (error) {
    console.error('Error fetching test by ID:', error);
    return null;
  }
};

/**
 * Calcular taxa de conversão
 */
export const calculateConversionRate = (views: number, conversions: number): number => {
  if (views === 0) return 0;
  return (conversions / views) * 100;
};

/**
 * Determinar vencedor do teste
 */
export const getTestWinner = (test: ABTest): 'A' | 'B' | 'tie' | 'insufficient_data' => {
  const { variantA, variantB } = test.results;
  
  // Precisa de pelo menos 100 views em cada variante
  if (variantA.views < 100 || variantB.views < 100) {
    return 'insufficient_data';
  }

  const rateA = calculateConversionRate(variantA.views, variantA.conversions);
  const rateB = calculateConversionRate(variantB.views, variantB.conversions);

  // Diferença precisa ser maior que 10% para ser significativa
  const difference = Math.abs(rateA - rateB);
  if (difference < 1) {
    return 'tie';
  }

  return rateA > rateB ? 'A' : 'B';
};
