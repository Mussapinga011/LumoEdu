import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Badge } from '../types/badge';
import { Trophy, Flame, Star, Award, Zap, Book, Crown } from 'lucide-react';

export const BADGES_COLLECTION = 'badges';
export const USER_BADGES_COLLECTION = 'userBadges';

// Predefined badges - Universal MZ slang (Gender Neutral)
export const DEFAULT_BADGES: Badge[] = [
  {
    id: 'first_win',
    name: 'Primeira Txilada',
    description: 'Já mambaste a tua primeira sessão! Estás a txilar bem.',
    icon: Award,
    color: 'text-blue-500',
    requirement: { type: 'sessions_completed', value: 1 },
    rarity: 'common'
  },
  {
    id: 'streak_3',
    name: 'Estás On Fire!',
    description: '3 sessões seguidas? Aqueceste as turbinas!',
    icon: Flame,
    color: 'text-orange-500',
    requirement: { type: 'streak', value: 3 },
    rarity: 'rare'
  },
  {
    id: 'perfect_score',
    name: 'Nível Pro no Mambo',
    description: '100% de acertos? Nem na sala de aula se vê isso!',
    icon: Star,
    color: 'text-purple-500',
    requirement: { type: 'perfect_score', value: 100 },
    rarity: 'epic'
  },
  {
    id: 'speed_demon',
    name: 'Papa-Léguas',
    description: 'Menos de 5 minutos? Voaste baixo nesta sessão!',
    icon: Zap,
    color: 'text-yellow-500',
    requirement: { type: 'speed', value: 300 },
    rarity: 'rare'
  },
  {
    id: 'discipline_master',
    name: 'Boss da Disciplina',
    description: 'Mambaste tudo nesta disciplina. Ninguém te segura!',
    icon: Crown,
    color: 'text-yellow-600',
    requirement: { type: 'discipline_master', value: 1 },
    rarity: 'legendary'
  },
  {
    id: 'dedicated_student',
    name: 'Foco Total',
    description: '10 sessões djobadas com sucesso. Que dedicação!',
    icon: Book,
    color: 'text-green-500',
    requirement: { type: 'sessions_completed', value: 10 },
    rarity: 'rare'
  },
  {
    id: 'knowledge_legend',
    name: 'Lenda de Moçambique',
    description: '50 sessões? Já podes dar aulas na UEM!',
    icon: Trophy,
    color: 'text-purple-600',
    requirement: { type: 'sessions_completed', value: 50 },
    rarity: 'legendary'
  }
];

export const BADGES = DEFAULT_BADGES;

/**
 * Migration/utility for old code compatibility
 */
export const checkNewBadges = (_user: any) => {
  return [];
};

/**
 * Check and award badges based on user progress
 * OPTIMIZED: Uses local constants and user object to minimize Firebase Reads.
 */
export const checkAndAwardBadges = async (
  userId: string,
  currentUserBadges: string[] = [],
  progressData: {
    sessionsCompleted: number;
    perfectScores: number;
    currentStreak: number;
    completionTime?: number;
    disciplineId?: string;
    allDisciplineSessionsCompleted?: boolean;
  }
): Promise<Badge[]> => {
  const newlyEarnedBadges: Badge[] = [];
  const earnedBadgeIds = new Set(currentUserBadges);

  for (const badge of DEFAULT_BADGES) {
    if (earnedBadgeIds.has(badge.id)) continue;

    let shouldAward = false;

    switch (badge.requirement.type) {
      case 'sessions_completed':
        shouldAward = Math.max(0, progressData.sessionsCompleted) >= badge.requirement.value;
        break;
      case 'perfect_score':
        shouldAward = progressData.perfectScores > 0;
        break;
      case 'streak':
        shouldAward = progressData.currentStreak >= badge.requirement.value;
        break;
      case 'speed':
        shouldAward = (progressData.completionTime || Infinity) <= badge.requirement.value;
        break;
      case 'discipline_master':
        shouldAward = progressData.allDisciplineSessionsCompleted === true;
        break;
    }

    if (shouldAward) {
      newlyEarnedBadges.push(badge);
    }
  }

  if (newlyEarnedBadges.length > 0) {
    const userRef = doc(db, 'users', userId);
    const newBadgeIds = newlyEarnedBadges.map(b => b.id);
    
    await updateDoc(userRef, {
      badges: arrayUnion(...newBadgeIds)
    });
  }

  return newlyEarnedBadges;
};

