export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  requirement: {
    type: 'sessions_completed' | 'perfect_score' | 'streak' | 'speed' | 'discipline_master';
    value: number;
    disciplineId?: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserBadge {
  badgeId: string;
  earnedAt: any; // Timestamp
  disciplineId?: string;
  sessionId?: string;
}
