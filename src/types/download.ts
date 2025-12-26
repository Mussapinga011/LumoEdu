import { Timestamp } from 'firebase/firestore';

export interface DownloadMaterial {
  id: string;
  title: string;
  description?: string;
  fileUrl: string; // External URL (Google Drive, etc.)
  fileSize?: string; // e.g., "2.4 MB"
  type: 'exam' | 'guide' | 'summary' | 'other';
  disciplineId: string;
  disciplineName: string;
  university: 'UEM' | 'UP' | 'all';
  year?: number;
  isPremium: boolean;
  downloadCount: number;
  createdAt: Timestamp;
}
