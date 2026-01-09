import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PracticeSession, PracticeQuestion, UserSessionProgress, PracticeSection } from '../types/practice';

const DISCIPLINES_COLLECTION = 'disciplines';
const PROGRESS_COLLECTION = 'sessionProgress';

/**
 * Get all sessions for a specific discipline
 */
export const getSessionsByDiscipline = async (disciplineId: string): Promise<PracticeSession[]> => {
  const sessionsRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sessions');
  const q = query(
    sessionsRef, 
    orderBy('order', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PracticeSession));
};


/**
 * Get questions for a specific session
 * Smartly handles both legacy and section-based paths if sectionId is provided.
 */
export const getQuestionsBySession = async (disciplineId: string, sessionId: string, sectionId?: string): Promise<PracticeQuestion[]> => {
  let questionsRef;
  
  if (sectionId) {
    questionsRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sections', sectionId, 'steps', sessionId, 'questions');
  } else {
     // Legacy or fallback: try standard path
     // If we are unsure, we might fail here for nested sessions if sectionId is missing.
     // For robustness, if this returns empty, we *could* try scanning sections, but that's expensive.
     // Better to always ensure sectionId is passed for new content.
     questionsRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sessions', sessionId, 'questions');
  }

  const querySnapshot = await getDocs(questionsRef);
  
  // Return empty if not found? 
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PracticeQuestion));
};


/**
 * Save user progress for a session
 */
export const saveSessionProgress = async (
  userId: string, 
  progress: Omit<UserSessionProgress, 'lastActive'>
): Promise<{ xpGranted: number, scoreImproved: boolean }> => {
  const progressRef = doc(db, 'users', userId, PROGRESS_COLLECTION, progress.sessionId);
  const progressSnap = await getDoc(progressRef);
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  let xpToGrant = progress.xpEarned;
  let scoreToGrant = progress.score; // Global score points
  let scoreImproved = false;
  let newBestScore = progress.score;

  if (progressSnap.exists()) {
    const data = progressSnap.data() as UserSessionProgress;
    
    // REPLAY LOGIC
    if (data.completed) {
      // If Replay, only grant partial XP if score is better than previous best
      if (progress.score > (data.score || 0)) {
        xpToGrant = Math.floor(progress.xpEarned * 0.5); // 50% XP for improvement
        scoreImproved = true;
        // Global score update: usually we don't want to double count the same session score for ranking
        // But if we want to reward improvement, maybe we grant a small bonus?
        // Let's assume global 'score' is a running total of 'points', separate from XP.
        // To be safe against farming, we'll grant 0 'score' (ranking points) on replay, 
        // or just the XP bonus. User asked specifically about XP logic.
        // Let's keep scoreToGrant = 0 to prevent ranking farm, unless specified.
        scoreToGrant = 0; 
      } else {
        xpToGrant = 0;
        scoreToGrant = 0;
      }
      // Update local best score
      newBestScore = Math.max(progress.score, data.score || 0);
    }
  }

  // Update Session Progress
  await setDoc(progressRef, {
    ...progress,
    score: newBestScore, // Always keep the best score
    // We don't overwrite xpEarned with 0, we might want to keep the max XP earning or just last?
    // Let's keep the last one or maybe just not update it if it's a replay with 0 xp?
    // For simplicity, let's update it to reflect the specific run activity
    xpEarned: progress.xpEarned, 
    lastActive: serverTimestamp()
  }, { merge: true });
  
  // Update Global User Profile
  if (userSnap.exists()) {
    const userData = userSnap.data();
    await setDoc(userRef, {
      ...userData,
      xp: (userData.xp || 0) + xpToGrant,
      score: (userData.score || 0) + scoreToGrant
    }, { merge: true });
  }

  return { xpGranted: xpToGrant, scoreImproved };
};

/**
 * Get all progress for a user in a discipline
 */
export const getUserProgressByDiscipline = async (
  userId: string, 
  disciplineId: string
): Promise<Record<string, UserSessionProgress>> => {
  const progressRef = collection(db, 'users', userId, PROGRESS_COLLECTION);
  const q = query(progressRef, where('disciplineId', '==', disciplineId));
  
  const querySnapshot = await getDocs(q);
  const progress: Record<string, UserSessionProgress> = {};
  
  querySnapshot.forEach(doc => {
    progress[doc.id] = doc.data() as UserSessionProgress;
  });
  
  return progress;
};

/**
 * Utility to remove undefined or NaN fields before saving to Firestore
 */
const sanitizeData = (data: any) => {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && (typeof data[key] !== 'number' || !isNaN(data[key]))) {
      clean[key] = data[key];
    }
  });
  return clean;
};


/**
 * GET Sections (Level 2)
 */
export const getSectionsByDiscipline = async (disciplineId: string): Promise<PracticeSection[]> => {
  const sectionsRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sections');
  const q = query(sectionsRef, orderBy('order', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PracticeSection));
};

/**
 * GET Steps/Sessions by Section (Level 3)
 */
export const getSessionsBySection = async (disciplineId: string, sectionId: string): Promise<PracticeSession[]> => {
  // Try fetching from the nested 'steps' collection first
  const stepsRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sections', sectionId, 'steps');
  const q = query(stepsRef, orderBy('order', 'asc'));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PracticeSession));
  }
  
  return [];
};

/**
 * ADMIN: Save Section
 */
export const saveSection = async (disciplineId: string, section: Partial<PracticeSection>): Promise<string> => {
  const sectionsRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sections');
  const docRef = section.id ? doc(sectionsRef, section.id) : doc(sectionsRef);
  
  const data = sanitizeData({
    ...section,
    id: docRef.id,
    disciplineId, // Ensure link
    updatedAt: serverTimestamp(),
  });

  await setDoc(docRef, data, { merge: true });
  return docRef.id;
};

/**
 * ADMIN: Delete a section
 * WARNING: This doesn't recursively delete steps/questions. 
 * In a real app we might want a cloud function for that, but here we just delete the section doc.
 */
export const deleteSection = async (disciplineId: string, sectionId: string): Promise<void> => {
  try {
    const sectionRef = doc(db, DISCIPLINES_COLLECTION, disciplineId, 'sections', sectionId);
    await deleteDoc(sectionRef);
  } catch (error) {
    console.error('Error in deleteSection:', error);
    throw error;
  }
};

/**
 * ADMIN: Create or update a session
 * Supports both legacy (direct child of discipline) and new (child of section) paths.
 */
export const saveSession = async (disciplineId: string, session: Partial<PracticeSession>): Promise<string> => {
  try {
    let sessionsColRef;
    
    // Check if we are saving to a section (New Structure)
    if (session.sectionId) {
      sessionsColRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sections', session.sectionId, 'steps');
    } else {
      // Legacy Structure
      sessionsColRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sessions');
    }

    const sessionRef = session.id ? doc(sessionsColRef, session.id) : doc(sessionsColRef);
    
    const data = sanitizeData({
      ...session,
      id: sessionRef.id,
      disciplineId, // Ensure it's correct
      quizIds: session.quizIds || [],
      updatedAt: serverTimestamp(),
      createdAt: session.createdAt || serverTimestamp()
    });
    
    await setDoc(sessionRef, data, { merge: true });
    return sessionRef.id;
  } catch (error) {
    console.error('Error in saveSession:', error);
    throw error;
  }
};

/**
 * ADMIN: Delete a session
 */
export const deleteSession = async (disciplineId: string, sessionId: string, sectionId?: string): Promise<void> => {
  try {
    if (sectionId) {
       await deleteDoc(doc(db, DISCIPLINES_COLLECTION, disciplineId, 'sections', sectionId, 'steps', sessionId));
    } else {
       await deleteDoc(doc(db, DISCIPLINES_COLLECTION, disciplineId, 'sessions', sessionId));
    }
  } catch (error) {
    console.error('Error in deleteSession:', error);
    throw error;
  }
};

/**
 * ADMIN: Create or update a question
 */
export const savePracticeQuestion = async (
  disciplineId: string, 
  sessionId: string, 
  question: Partial<PracticeQuestion>,
  sectionId?: string
): Promise<string> => {
  try {
    let questionsColRef;
    // Helper to determine path based on where session is located
    // Note: We need sectionId to know where to find the session if it's nested
    if (sectionId) {
       questionsColRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sections', sectionId, 'steps', sessionId, 'questions');
    } else {
       questionsColRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sessions', sessionId, 'questions');
    }

    const questionRef = question.id ? doc(questionsColRef, question.id) : doc(questionsColRef);
    
    const data = sanitizeData({
      ...question,
      id: questionRef.id,
      sessionId,
      updatedAt: serverTimestamp(),
      createdAt: question.createdAt || serverTimestamp()
    });
    
    await setDoc(questionRef, data, { merge: true });
    return questionRef.id;
  } catch (error) {
    console.error('Error in savePracticeQuestion:', error);
    throw error;
  }
};

/**
 * ADMIN: Delete a question
 */
export const deletePracticeQuestion = async (
  disciplineId: string, 
  sessionId: string, 
  questionId: string,
  sectionId?: string
): Promise<void> => {
  try {
    if (sectionId) {
      await deleteDoc(doc(db, DISCIPLINES_COLLECTION, disciplineId, 'sections', sectionId, 'steps', sessionId, 'questions', questionId));
    } else {
      await deleteDoc(doc(db, DISCIPLINES_COLLECTION, disciplineId, 'sessions', sessionId, 'questions', questionId));
    }
  } catch (error) {
    console.error('Error in deletePracticeQuestion:', error);
    throw error;
  }
};

