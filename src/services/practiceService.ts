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
import { PracticeSession, PracticeQuestion, UserSessionProgress } from '../types/practice';

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
 */
export const getQuestionsBySession = async (disciplineId: string, sessionId: string): Promise<PracticeQuestion[]> => {
  const questionsRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sessions', sessionId, 'questions');
  const querySnapshot = await getDocs(questionsRef);
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
 * ADMIN: Create or update a session
 */
export const saveSession = async (disciplineId: string, session: Partial<PracticeSession>): Promise<string> => {
  try {
    const sessionsColRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sessions');
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
export const deleteSession = async (disciplineId: string, sessionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, DISCIPLINES_COLLECTION, disciplineId, 'sessions', sessionId));
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
  question: Partial<PracticeQuestion>
): Promise<string> => {
  try {
    const questionsColRef = collection(db, DISCIPLINES_COLLECTION, disciplineId, 'sessions', sessionId, 'questions');
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
  questionId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, DISCIPLINES_COLLECTION, disciplineId, 'sessions', sessionId, 'questions', questionId));
  } catch (error) {
    console.error('Error in deletePracticeQuestion:', error);
    throw error;
  }
};

