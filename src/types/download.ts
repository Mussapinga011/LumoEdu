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
  universityId: string; // ID da universidade ('all' se for geral)
  universityName?: string; // Nome da universidade ('Geral' se for para todas)
  year?: number;
  isPremium: boolean;
  downloadCount: number;
  createdAt: Timestamp;
}
