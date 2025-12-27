import { Timestamp } from 'firebase/firestore';

export interface Discipline {
  id: string;
  title: string;
  icon: string; // Emoji or icon identifier
  color: string; // Tailwind color class (e.g., "bg-blue-100 text-blue-600")
  universityId: string; // Reference to University
  universityName: string; // Denormalized for easier queries
  isActive: boolean;
  createdAt: Timestamp;
}
