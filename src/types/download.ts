export interface DownloadMaterial {
  id: string;
  title: string;
  description: string;
  url?: string; // Legacy
  fileUrl: string;
  fileSize?: string;
  type: 'exam' | 'guide' | 'summary' | 'other';
  disciplineId: string;
  disciplineName: string;
  universityId: string;
  universityName: string;
  year: number;
  accessLevel?: 'free' | 'premium'; // Legacy
  isPremium: boolean;
  downloadCount: number;
  createdAt?: any;
}
