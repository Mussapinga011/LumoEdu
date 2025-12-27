import { Timestamp } from 'firebase/firestore';

export interface University {
  id: string;
  name: string;
  shortName: string; // Ex: "UEM", "UP"
  isActive: boolean;
  createdAt: Timestamp;
}
