export interface VideoLesson {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration: number; // seconds
  disciplineId: string;
  sectionId?: string;
  orderIndex: number;
  createdAt?: any;
}
