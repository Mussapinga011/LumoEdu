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
  arrayUnion,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserActivity, StudyPlan } from '../types/user';
import { Exam, Question } from '../types/exam';
import { DownloadMaterial } from '../types/download';
import { checkNewBadges } from './badgeService';

// --- User Operations ---

// Check if displayName already exists
export const checkDisplayNameExists = async (displayName: string): Promise<boolean> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('displayName', '==', displayName));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

export const createUserProfile = async (user: UserProfile) => {
  // Check if displayName already exists
  const nameExists = await checkDisplayNameExists(user.displayName);
  if (nameExists) {
    throw new Error('This name is already taken. Please choose a different name.');
  }

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

export const deleteUserProfile = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  await deleteDoc(userRef);
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

export const getExamsByDiscipline = async (disciplineId: string, activeOnly: boolean = true): Promise<Exam[]> => {
  const examsRef = collection(db, 'exams');
  const q = query(examsRef, where('disciplineId', '==', disciplineId));
  
  const querySnapshot = await getDocs(q);
  const allExams = querySnapshot.docs.map(doc => doc.data() as Exam);
  
  // Filter by active status in JavaScript (for backward compatibility)
  // Exams without isActive field are considered active by default
  if (activeOnly) {
    return allExams.filter(exam => exam.isActive !== false);
  }
  
  return allExams;
};

// Get all exams (for admin use)
export const getAllExams = async (): Promise<Exam[]> => {
  const examsRef = collection(db, 'exams');
  const querySnapshot = await getDocs(examsRef);
  return querySnapshot.docs.map(doc => doc.data() as Exam);
};

// Get only active exams (for regular users)
export const getActiveExams = async (): Promise<Exam[]> => {
  const examsRef = collection(db, 'exams');
  const querySnapshot = await getDocs(examsRef);
  const allExams = querySnapshot.docs.map(doc => doc.data() as Exam);
  
  // Filter in JavaScript - exams without isActive are considered active
  return allExams.filter(exam => exam.isActive !== false);
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

/**
 * Importação em massa de questões
 * Cria múltiplas questões de uma vez usando batch writes
 */
export const bulkImportQuestions = async (
  examId: string,
  questions: Omit<Question, 'id'>[]
): Promise<string[]> => {
  const { writeBatch } = await import('firebase/firestore');
  const batch = writeBatch(db);
  const questionIds: string[] = [];
  
  // Criar todas as questões em batch
  for (const questionData of questions) {
    const questionsRef = collection(db, 'questions');
    const newDocRef = doc(questionsRef); // Gera ID automaticamente
    
    batch.set(newDocRef, {
      ...questionData,
      id: newDocRef.id,
      examId
    });
    
    questionIds.push(newDocRef.id);
  }
  
  // Atualizar contador de questões do exame
  const examRef = doc(db, 'exams', examId);
  batch.update(examRef, {
    questionsCount: questions.length
  });
  
  // Executar batch
  await batch.commit();
  
  return questionIds;
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

// --- DOWNLOAD MATERIALS FUNCTIONS ---

const DOWNLOADS_COLLECTION = 'downloads';

export const createDownloadMaterial = async (data: Omit<DownloadMaterial, 'id' | 'downloadCount' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, DOWNLOADS_COLLECTION), {
    ...data,
    downloadCount: 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateDownloadMaterial = async (id: string, data: Partial<DownloadMaterial>): Promise<void> => {
  const docRef = doc(db, DOWNLOADS_COLLECTION, id);
  await updateDoc(docRef, data);
};

export const deleteDownloadMaterial = async (id: string): Promise<void> => {
  const docRef = doc(db, DOWNLOADS_COLLECTION, id);
  await deleteDoc(docRef);
};

export const getAllDownloads = async (): Promise<DownloadMaterial[]> => {
  const q = query(collection(db, DOWNLOADS_COLLECTION), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DownloadMaterial));
};


export const incrementDownloadCount = async (id: string): Promise<void> => {
  const docRef = doc(db, DOWNLOADS_COLLECTION, id);
  await updateDoc(docRef, {
    downloadCount: increment(1)
  });
};

// --- UNIVERSITY MANAGEMENT FUNCTIONS ---

import { University } from '../types/university';
import { Discipline } from '../types/discipline';

const UNIVERSITIES_COLLECTION = 'universities';
const DISCIPLINES_COLLECTION = 'disciplines';

export const createUniversity = async (data: Omit<University, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, UNIVERSITIES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp()
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
};

export const updateUniversity = async (id: string, data: Partial<University>): Promise<void> => {
  const docRef = doc(db, UNIVERSITIES_COLLECTION, id);
  await updateDoc(docRef, data);
};

export const deleteUniversity = async (id: string): Promise<void> => {
  const docRef = doc(db, UNIVERSITIES_COLLECTION, id);
  await deleteDoc(docRef);
};

export const getAllUniversities = async (): Promise<University[]> => {
  const q = query(collection(db, UNIVERSITIES_COLLECTION), orderBy('name'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as University));
};

export const getActiveUniversities = async (): Promise<University[]> => {
  const q = query(
    collection(db, UNIVERSITIES_COLLECTION), 
    where('isActive', '==', true)
  );
  const querySnapshot = await getDocs(q);
  // Sort in memory to avoid index requirements
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as University))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// --- DISCIPLINE MANAGEMENT FUNCTIONS ---

export const createDiscipline = async (data: Omit<Discipline, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, DISCIPLINES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp()
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
};

export const updateDiscipline = async (id: string, data: Partial<Discipline>): Promise<void> => {
  const docRef = doc(db, DISCIPLINES_COLLECTION, id);
  await updateDoc(docRef, data);
};

export const deleteDiscipline = async (id: string): Promise<void> => {
  const docRef = doc(db, DISCIPLINES_COLLECTION, id);
  await deleteDoc(docRef);
};

export const getAllDisciplines = async (): Promise<Discipline[]> => {
  const q = query(collection(db, DISCIPLINES_COLLECTION), orderBy('title'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discipline));
};

export const getActiveDisciplines = async (): Promise<Discipline[]> => {
  const q = query(
    collection(db, DISCIPLINES_COLLECTION),
    where('isActive', '==', true)
  );
  const querySnapshot = await getDocs(q);
  // Sort in memory to avoid index requirements
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Discipline))
    .sort((a, b) => a.title.localeCompare(b.title));
};

export const getDisciplinesByUniversity = async (universityId: string): Promise<Discipline[]> => {
  const q = query(
    collection(db, DISCIPLINES_COLLECTION),
    where('universityId', '==', universityId),
    where('isActive', '==', true)
  );
  const querySnapshot = await getDocs(q);
  // Sort in memory to avoid index requirements
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Discipline))
    .sort((a, b) => a.title.localeCompare(b.title));
};

export const initializeDefaultContent = async () => {
  const universities = [
    { name: 'Universidade Eduardo Mondlane', shortName: 'UEM', isActive: true },
    { name: 'Universidade Pedagógica', shortName: 'UP', isActive: true }
  ];

  const disciplines = [
    // UEM
    { title: 'Biologia', universityShort: 'UEM', icon: '🧬', color: 'bg-green-100 text-green-600' },
    { title: 'Filosofia', universityShort: 'UEM', icon: '🤔', color: 'bg-yellow-100 text-yellow-600' },
    { title: 'Física', universityShort: 'UEM', icon: '⚡', color: 'bg-yellow-100 text-yellow-600' },
    { title: 'Francês', universityShort: 'UEM', icon: '🇫🇷', color: 'bg-blue-100 text-blue-600' },
    { title: 'Geografia', universityShort: 'UEM', icon: '🌍', color: 'bg-teal-100 text-teal-600' },
    { title: 'História', universityShort: 'UEM', icon: '🏛️', color: 'bg-orange-100 text-orange-600' },
    { title: 'Inglês', universityShort: 'UEM', icon: '🇬🇧', color: 'bg-purple-100 text-purple-600' },
    { title: 'Matemática', universityShort: 'UEM', icon: '📐', color: 'bg-red-100 text-red-600' },
    { title: 'Música', universityShort: 'UEM', icon: '🎵', color: 'bg-pink-100 text-pink-600' },
    { title: 'Português 1', universityShort: 'UEM', icon: '📚', color: 'bg-blue-100 text-blue-600' },
    { title: 'Português 2', universityShort: 'UEM', icon: '📖', color: 'bg-blue-100 text-blue-600' },
    { title: 'Química', universityShort: 'UEM', icon: '🧪', color: 'bg-pink-100 text-pink-600' },
    { title: 'Desenho 1', universityShort: 'UEM', icon: '✏️', color: 'bg-gray-100 text-gray-600' },
    { title: 'Desenho 2', universityShort: 'UEM', icon: '🎨', color: 'bg-gray-100 text-gray-600' },
    { title: 'Teatro', universityShort: 'UEM', icon: '🎭', color: 'bg-red-100 text-red-600' },
    // UP
    { title: 'Biologia', universityShort: 'UP', icon: '🧬', color: 'bg-green-100 text-green-600' },
    { title: 'Biologia (Ed. Física)', universityShort: 'UP', icon: '🏃', color: 'bg-green-100 text-green-600' },
    { title: 'Desenho', universityShort: 'UP', icon: '✏️', color: 'bg-gray-100 text-gray-600' },
    { title: 'Filosofia', universityShort: 'UP', icon: '🤔', color: 'bg-yellow-100 text-yellow-600' },
    { title: 'Física', universityShort: 'UP', icon: '⚡', color: 'bg-yellow-100 text-yellow-600' },
    { title: 'Francês', universityShort: 'UP', icon: '🇫🇷', color: 'bg-blue-100 text-blue-600' },
    { title: 'Geografia', universityShort: 'UP', icon: '🌍', color: 'bg-teal-100 text-teal-600' },
    { title: 'História', universityShort: 'UP', icon: '🏛️', color: 'bg-orange-100 text-orange-600' },
    { title: 'Inglês', universityShort: 'UP', icon: '🇬🇧', color: 'bg-purple-100 text-purple-600' },
    { title: 'Matemática', universityShort: 'UP', icon: '📐', color: 'bg-red-100 text-red-600' },
    { title: 'Português', universityShort: 'UP', icon: '📚', color: 'bg-blue-100 text-blue-600' },
    { title: 'Química', universityShort: 'UP', icon: '🧪', color: 'bg-pink-100 text-pink-600' },
  ];

  // 1. Create Universities
  const universityMap: Record<string, string> = {};
  for (const uniData of universities) {
    const id = await createUniversity(uniData);
    universityMap[uniData.shortName] = id;
  }

  // 2. Create Disciplines
  for (const discData of disciplines) {
    const universityId = universityMap[discData.universityShort];
    if (universityId) {
      await createDiscipline({
        title: discData.title,
        icon: discData.icon,
        color: discData.color,
        universityId,
        universityName: universities.find(u => u.shortName === discData.universityShort)?.name || '',
        isActive: true
      });
    }
  }
};

