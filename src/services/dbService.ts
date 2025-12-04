import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  orderBy,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserActivity, StudyPlan } from '../types/user';
import { Exam, Question } from '../types/exam';
import { checkNewBadges } from './badgeService';

// --- User Operations ---

export const createUserProfile = async (user: UserProfile) => {
  const userRef = doc(db, 'users', user.uid);
  // Ensure all new fields are initialized
  const newUser: UserProfile = {
    ...user,
    isPremium: user.isPremium || false,
    lastExamDate: null,
    lastChallengeDate: null,
    examsCompleted: 0,
    challengesCompleted: 0,
    averageGrade: 0,
    score: 0,
    dataSaverMode: false,
    createdAt: Timestamp.now()
  };
  await setDoc(userRef, newUser);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  } else {
    return null;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
};

export const updateUserScore = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const user = userSnap.data() as UserProfile;
    
    // Calculate score based only on challenges completed
    const score = Math.round(user.challengesCompleted * 3);
    
    await updateDoc(userRef, { score });
    
    // Check for new badges
    await checkAndAwardBadges(uid);
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('displayName'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

// --- Exam Operations ---

export const createExam = async (exam: Omit<Exam, 'id'>) => {
  const examsRef = collection(db, 'exams');
  const docRef = await addDoc(examsRef, {
    ...exam,
    createdAt: Timestamp.now()
  });
  // Update the doc with its own ID
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
};

export const getExamsByDiscipline = async (disciplineId: string): Promise<Exam[]> => {
  const examsRef = collection(db, 'exams');
  const q = query(examsRef, where('disciplineId', '==', disciplineId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Exam);
};

export const getAllExams = async (): Promise<Exam[]> => {
  const examsRef = collection(db, 'exams');
  const querySnapshot = await getDocs(examsRef);
  return querySnapshot.docs.map(doc => doc.data() as Exam);
};

export const getExam = async (examId: string): Promise<Exam | null> => {
  const examRef = doc(db, 'exams', examId);
  const docSnap = await getDoc(examRef);
  if (docSnap.exists()) {
    return docSnap.data() as Exam;
  }
  return null;
};

export const updateExam = async (examId: string, data: Partial<Exam>) => {
  const examRef = doc(db, 'exams', examId);
  await updateDoc(examRef, data);
};

export const deleteExam = async (examId: string) => {
  const examRef = doc(db, 'exams', examId);
  await deleteDoc(examRef);
  
  // Also delete all questions for this exam
  const questions = await getQuestionsByExam(examId);
  for (const question of questions) {
    await deleteQuestion(question.id);
  }
};

// --- Question Operations ---

export const createQuestion = async (question: Omit<Question, 'id'>) => {
  const questionsRef = collection(db, 'questions');
  const docRef = await addDoc(questionsRef, question);
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
};

export const getQuestionsByExam = async (examId: string): Promise<Question[]> => {
  const questionsRef = collection(db, 'questions');
  const q = query(questionsRef, where('examId', '==', examId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Question);
};

export const updateQuestion = async (questionId: string, data: Partial<Question>) => {
  const questionRef = doc(db, 'questions', questionId);
  await updateDoc(questionRef, data);
};

export const deleteQuestion = async (questionId: string) => {
  const questionRef = doc(db, 'questions', questionId);
  await deleteDoc(questionRef);
};

export const addUserActivity = async (uid: string, activity: Omit<UserActivity, 'id'>) => {
  const userRef = doc(db, 'users', uid);
  const newActivity: UserActivity = {
    ...activity,
    id: crypto.randomUUID()
  };
  await updateDoc(userRef, {
    recentActivity: arrayUnion(newActivity)
  });
};

export const saveStudyPlan = async (uid: string, plan: StudyPlan) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    studyPlan: plan
  });
};

export const updateUserDisciplineScore = async (uid: string, disciplineId: string, scoreToAdd: number) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const user = userSnap.data() as UserProfile;
    const currentScores = user.disciplineScores || {};
    const currentScore = currentScores[disciplineId] || 0;
    
    await updateDoc(userRef, {
      [`disciplineScores.${disciplineId}`]: currentScore + scoreToAdd
    });
    
    // Check for new badges
    await checkAndAwardBadges(uid);
  }
};


export const checkAndAwardBadges = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const user = userSnap.data() as UserProfile;
    const newBadges = checkNewBadges(user);
    
    if (newBadges.length > 0) {
      const currentBadges = user.badges || [];
      await updateDoc(userRef, {
        badges: [...currentBadges, ...newBadges]
      });
      return newBadges;
    }
  }
  return [];
};

// --- Video Lesson Operations ---

import { VideoLesson } from '../types/video';
import { startAfter, limit } from 'firebase/firestore';
import { extractYoutubeId, getYoutubeThumbnail } from '../lib/youtubeUtils';

export const createVideoLesson = async (video: Omit<VideoLesson, 'id' | 'createdAt' | 'youtubeId' | 'thumbnailUrl'>) => {
  const youtubeId = extractYoutubeId(video.youtubeUrl);
  if (!youtubeId) {
    throw new Error("Invalid YouTube URL");
  }

  const thumbnailUrl = getYoutubeThumbnail(youtubeId, 'hq');

  const videosRef = collection(db, 'videos');
  const docRef = await addDoc(videosRef, {
    ...video,
    youtubeId,
    thumbnailUrl,
    createdAt: Timestamp.now()
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
};

export const updateVideoLesson = async (videoId: string, data: Partial<VideoLesson>) => {
  const videoRef = doc(db, 'videos', videoId);
  
  // If URL is updated, we must update ID and thumbnail too
  if (data.youtubeUrl) {
    const youtubeId = extractYoutubeId(data.youtubeUrl);
    if (youtubeId) {
      data.youtubeId = youtubeId;
      data.thumbnailUrl = getYoutubeThumbnail(youtubeId, 'hq');
    }
  }
  
  await updateDoc(videoRef, data);
};

export const getVideoLessons = async (
  lastDoc: any = null, 
  pageSize: number = 20,
  filters?: { subject?: string }
): Promise<{ videos: VideoLesson[]; lastDoc: any }> => {
  const videosRef = collection(db, 'videos');
  
  // Construct base query with filters
  let qBase = query(videosRef);
  if (filters && filters.subject) {
    qBase = query(qBase, where('subject', '==', filters.subject));
  }

  // Try with ordering first
  try {
    let q = query(qBase, orderBy('order', 'asc'), limit(pageSize));
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map(doc => doc.data() as VideoLesson);
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    return { videos, lastDoc: newLastDoc };

  } catch (error: any) {
    // If error is due to missing index (failed-precondition), try without ordering
    if (error.code === 'failed-precondition' || error.message.includes('index')) {
      console.warn("Firestore Index missing. Falling back to unordered query. Please create the index using the link in console.");
      
      let q = query(qBase, limit(pageSize));
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      
      const querySnapshot = await getDocs(q);
      const videos = querySnapshot.docs.map(doc => doc.data() as VideoLesson);
      
      // Sort in memory (best effort for current page)
      videos.sort((a, b) => a.order - b.order);
      
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      return { videos, lastDoc: newLastDoc };
    }
    throw error;
  }
};

export const deleteVideoLesson = async (videoId: string) => {
  const videoRef = doc(db, 'videos', videoId);
  await deleteDoc(videoRef);
};
