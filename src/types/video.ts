import { Timestamp } from 'firebase/firestore';

export interface VideoLesson {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl?: string;
  subject: string;
  videoType: 'theory' | 'exercise';
  order: number;
  createdAt: Timestamp;
}
