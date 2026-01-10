import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Exam, Question } from '../types/exam';

interface OfflineDB extends DBSchema {
  exams: {
    key: string;
    value: {
      id: string;
      title: string;
      disciplineId: string;
      university: string;
      year: number;
      downloadedAt: number;
      questions: Question[];
    };
  };
  progress: {
    key: string;
    value: {
      examId: string;
      userId: string;
      answers: Record<string, string>;
      startedAt: number;
      lastUpdated: number;
      synced: boolean;
    };
  };
  metadata: {
    key: string;
    value: {
      totalSize: number;
      lastSync: number;
      examCount: number;
    };
  };
}

const DB_NAME = 'admissionPlatform';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

async function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db: IDBPDatabase<OfflineDB>) {
      // Create exams store
      if (!db.objectStoreNames.contains('exams')) {
        db.createObjectStore('exams', { keyPath: 'id' });
      }

      // Create progress store
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'examId' });
      }

      // Create metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Download exam for offline use
export async function downloadExam(exam: Exam, questions: Question[]): Promise<void> {
  const db = await getDB();
  
  const offlineExam = {
    id: exam.id,
    title: exam.name || exam.id, // Use exam name if available
    disciplineId: exam.disciplineId,
    university: exam.university || 'UEM', // Use exam's university or fallback to UEM
    year: exam.year || new Date().getFullYear(),
    downloadedAt: Date.now(),
    questions,
  };

  await db.put('exams', offlineExam);

  // Update metadata
  const metadata = await db.get('metadata', 'stats') || {
    key: 'stats',
    totalSize: 0,
    lastSync: Date.now(),
    examCount: 0,
  };

  metadata.examCount = await db.count('exams');
  metadata.lastSync = Date.now();
  
  await db.put('metadata', metadata);
}

// Get all downloaded exams
export async function getDownloadedExams(): Promise<any[]> {
  const db = await getDB();
  return db.getAll('exams');
}

// Get specific exam
export async function getOfflineExam(examId: string): Promise<any | null> {
  const db = await getDB();
  return db.get('exams', examId);
}

// Remove exam
export async function removeOfflineExam(examId: string): Promise<void> {
  const db = await getDB();
  await db.delete('exams', examId);

  // Update metadata
  const metadata = await db.get('metadata', 'stats');
  if (metadata) {
    metadata.examCount = await db.count('exams');
    await db.put('metadata', metadata);
  }
}

// Save progress locally
export async function saveOfflineProgress(
  examId: string,
  userId: string,
  answers: Record<string, string>
): Promise<void> {
  const db = await getDB();
  
  const progress = {
    examId,
    userId,
    answers,
    startedAt: Date.now(),
    lastUpdated: Date.now(),
    synced: false,
  };

  await db.put('progress', progress);
}

// Get progress
export async function getOfflineProgress(examId: string): Promise<any | null> {
  const db = await getDB();
  return db.get('progress', examId);
}

// Get all unsynced progress
export async function getUnsyncedProgress(): Promise<any[]> {
  const db = await getDB();
  const allProgress = await db.getAll('progress');
  return allProgress.filter((p: any) => !p.synced);
}

// Mark progress as synced
export async function markProgressSynced(examId: string): Promise<void> {
  const db = await getDB();
  const progress = await db.get('progress', examId);
  
  if (progress) {
    progress.synced = true;
    await db.put('progress', progress);
  }
}

// Get storage stats
export async function getStorageStats(): Promise<{
  examCount: number;
  lastSync: number;
  estimatedSize: number;
}> {
  const db = await getDB();
  const metadata = await db.get('metadata', 'stats') || {
    examCount: 0,
    lastSync: 0,
    totalSize: 0,
  };

  // Estimate size (rough calculation)
  const exams = await db.getAll('exams');
  const estimatedSize = JSON.stringify(exams).length;

  return {
    examCount: metadata.examCount,
    lastSync: metadata.lastSync,
    estimatedSize,
  };
}

// Clear all offline data
export async function clearOfflineData(): Promise<void> {
  const db = await getDB();
  await db.clear('exams');
  await db.clear('progress');
  await db.clear('metadata');
}
