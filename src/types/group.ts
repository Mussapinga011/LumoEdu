export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  disciplineId: string;
  disciplineName: string;
  createdBy: string; // userId
  createdAt?: any;
  isPrivate: boolean;
  discipline_name?: string; // Compatibility
  created_by?: string; // Compatibility
}

export interface GroupMember {
  userId: string;
  joinedAt: any;
  role: 'member' | 'admin';
}

export interface GroupMessage {
  id: string;
  groupId?: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  userPhotoURL?: string; // Alias
  text?: string; // Some parts use 'text' instead of 'content'
  content: string;
  timestamp: any;
  createdAt?: any; // Alias
  type: 'text' | 'image' | 'system';
  isSystemMessage?: boolean;
}
