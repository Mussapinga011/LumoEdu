export interface Discipline {
  id: string;
  title: string;
  icon: string;
  color: string;
  universityId?: string;
  universityName?: string;
  isActive: boolean;
  createdAt?: any;
}
