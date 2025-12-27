import { UserProfile } from '../types/user';
import { Trophy, Flame, Star, BookOpen, Target, Zap } from 'lucide-react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any; // Lucide icon component
  color: string;
  condition: (user: UserProfile) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: 'first_win',
    name: 'Primeira Vitória',
    description: 'Complete o seu primeiro desafio',
    icon: Trophy,
    color: 'text-yellow-500',
    condition: (user) => (user.challengesCompleted || 0) >= 1
  },
  {
    id: 'streak_master',
    name: 'Mestre da Sequência',
    description: 'Alcance uma sequência de 7 dias de estudo',
    icon: Flame,
    color: 'text-orange-500',
    condition: (user) => (user.streak || 0) >= 7
  },
  {
    id: 'dedicated_learner',
    name: 'Estudante Dedicado',
    description: 'Alcance o Nível 5',
    icon: BookOpen,
    color: 'text-blue-500',
    condition: (user) => (user.level || 1) >= 5
  },
  {
    id: 'xp_hunter',
    name: 'Caçador de XP',
    description: 'Ganhe um total de 1000 XP',
    icon: Star,
    color: 'text-purple-500',
    condition: (user) => (user.xp || 0) >= 1000
  },
  {
    id: 'exam_ready',
    name: 'Pronto para o Exame',
    description: 'Complete 5 exames completos',
    icon: Target,
    color: 'text-red-500',
    condition: (user) => (user.examsCompleted || 0) >= 5
  },
  {
    id: 'fast_learner',
    name: 'Aprendiz Rápido',
    description: 'Complete 50 exercícios diários',
    icon: Zap,
    color: 'text-green-500',
    condition: (user) => (user.dailyExercisesCount || 0) >= 50
  }
];

export const checkNewBadges = (user: UserProfile): string[] => {
  const currentBadges = user.badges || [];
  const newBadges: string[] = [];

  BADGES.forEach(badge => {
    if (!currentBadges.includes(badge.id) && badge.condition(user)) {
      newBadges.push(badge.id);
    }
  });

  return newBadges;
};

export const getBadgeById = (id: string): Badge | undefined => {
  return BADGES.find(b => b.id === id);
};
