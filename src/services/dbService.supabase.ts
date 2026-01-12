import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/user';
import { getAllExams } from './examService.supabase';
import { getAllUniversities } from './contentService.supabase';

export { getAllExams, getAllUniversities };

/**
 * Obter todos os usuários (apenas admin)
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        user_badges(badge_name, earned_at),
        user_activities(activity_type, title, xp_earned, timestamp)
      `)
      .order('xp', { ascending: false });

    if (error) throw error;

    return data.map((user: any) => ({
      uid: user.id,
      id: user.id, // Adicionar id para compatibilidade
      email: '', 
      displayName: user.display_name || '',
      photoURL: user.photo_url || '',
      role: user.role as 'user' | 'admin',
      isPremium: user.is_premium,
      level: user.level,
      xp: user.xp,
      streak: user.streak,
      examsCompleted: user.exams_completed || 0,
      challengesCompleted: user.challenges_completed || 0,
      averageGrade: user.average_grade || 0,
      score: user.score || 0,
      dailyExercisesCount: user.daily_exercises_count || 0,
      lastActive: user.last_active ? new Date(user.last_active) : undefined,
      lastStudyDate: user.last_study_date ? new Date(user.last_study_date) : null,
      lastExamDate: user.last_exam_date ? new Date(user.last_exam_date) : null,
      lastChallengeDate: user.last_challenge_date ? new Date(user.last_challenge_date) : null,
      badges: user.user_badges?.map((b: any) => b.badge_name) || [],
      recentActivity: user.user_activities?.map((a: any) => ({
        type: a.activity_type,
        title: a.title,
        xpEarned: a.xp_earned,
        timestamp: new Date(a.timestamp)
      })) || []
    }));
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
};

/**
 * Obter usuário por ID
 */
export const getUserById = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('dbService: Executing query for', userId);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('dbService: Supabase error in getUserById:', error);
      throw error;
    }
    
    if (!data) {
      console.log('dbService: No profile found for', userId);
      return null;
    }

    console.log('dbService: Profile found, mapping data...');

    return {
      uid: data.id,
      id: data.id, // Adicionar id
      email: '', 
      displayName: data.display_name || '',
      photoURL: data.photo_url || '',
      role: data.role as 'user' | 'admin',
      isPremium: data.is_premium,
      level: data.level,
      xp: data.xp,
      streak: data.streak,
      examsCompleted: data.exams_completed || 0,
      challengesCompleted: data.challenges_completed || 0,
      averageGrade: data.average_grade || 0,
      score: data.score || 0,
      dailyExercisesCount: data.daily_exercises_count || 0,
      lastActive: data.last_active ? new Date(data.last_active) : undefined,
      lastStudyDate: data.last_study_date ? new Date(data.last_study_date) : null,
      lastExamDate: data.last_exam_date ? new Date(data.last_exam_date) : null,
      lastChallengeDate: data.last_challenge_date ? new Date(data.last_challenge_date) : null,
      badges: [], // Removido joins temporariamente para depuração
      recentActivity: []
    };
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
};

/**
 * Verificar se o nome de exibição já existe
 */
export const checkDisplayNameExists = async (displayName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('display_name', displayName)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking display name existence:', error);
    return false;
  }
};

/**
 * Atualizar usuário generico
 */
export const updateUserProfile = async (userId: string, updates: any) => {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
};

/**
 * Legacy wrapper
 */
export const updateUser = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
   const mappedUpdates: any = {};
   if (updates.displayName !== undefined) mappedUpdates.display_name = updates.displayName;
   if (updates.photoURL !== undefined) mappedUpdates.photo_url = updates.photoURL;
   if (updates.isPremium !== undefined) mappedUpdates.is_premium = updates.isPremium;
   if (updates.xp !== undefined) mappedUpdates.xp = updates.xp;
   if (updates.level !== undefined) mappedUpdates.level = updates.level;
   
   await updateUserProfile(userId, mappedUpdates);
};

/**
 * Salvar Plano de Estudo
 */
export const saveStudyPlan = async (userId: string, plan: any) => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ 
      study_plan: plan,
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId);
  if (error) throw error;
};

/**
 * Resumo de score (badges etc)
 */
export const updateUserScore = async (userId: string) => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ last_active: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
};

/**
 * Adicionar atividade recente
 */
export const addUserActivity = async (
  userId: string,
  activity: {
    type: string;
    title: string;
    xpEarned: number;
    score?: number;
  }
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: activity.type,
        title: activity.title,
        xp_earned: activity.xpEarned,
        score: activity.score || 0
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error in addUserActivity:', error);
  }
};

/**
 * Adicionar XP ao usuário
 */
export const addUserXP = async (userId: string, xpAmount: number): Promise<void> => {
  try {
    const { data: user } = await supabase.from('user_profiles').select('xp').eq('id', userId).single();
    if (!user) return;

    const newXp = (user.xp || 0) + xpAmount;
    const newLevel = Math.floor(newXp / 100) + 1;

    await supabase.from('user_profiles').update({
      xp: newXp,
      level: newLevel,
      updated_at: new Date().toISOString()
    }).eq('id', userId);
  } catch (error) {
    console.error('Error in addUserXP:', error);
  }
};

/**
 * Adicionar badge ao usuário
 */
export const addUserBadge = async (userId: string, badgeName: string): Promise<void> => {
  const { error } = await supabase
    .from('user_badges')
    .insert({ user_id: userId, badge_name: badgeName });
  if (error && error.code !== '23505') throw error; 
};

/**
 * Promover usuário para Premium
 */
export const promoteUserToPremium = async (userId: string): Promise<void> => {
  await updateUserProfile(userId, { is_premium: true });
};

/**
 * Remover Premium do usuário
 */
export const demoteUserFromPremium = async (userId: string): Promise<void> => {
  await updateUserProfile(userId, { is_premium: false });
};

export const deleteUser = async (userId: string) => {
  const { error } = await supabase.from('user_profiles').delete().eq('id', userId);
  if (error) throw error;
};

/**
 * Downloads CRUD
 */
export const getAllDownloads = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('downloads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((d: any) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    fileUrl: d.file_url,
    fileSize: d.file_size,
    type: d.type,
    disciplineId: d.discipline_id,
    disciplineName: d.discipline_name,
    universityId: d.university_id,
    universityName: d.university_name,
    year: d.year,
    isPremium: d.is_premium,
    downloadCount: d.download_count,
    createdAt: d.created_at
  }));
};

export const createDownloadMaterial = async (material: any) => {
  const { error } = await supabase
    .from('downloads')
    .insert({
      title: material.title,
      description: material.description,
      file_url: material.fileUrl,
      file_size: material.fileSize,
      type: material.type,
      discipline_id: material.disciplineId,
      discipline_name: material.disciplineName,
      university_id: material.universityId,
      university_name: material.universityName,
      year: material.year,
      is_premium: material.isPremium
    });
  if (error) throw error;
};

export const updateDownloadMaterial = async (id: string, material: any) => {
  const { error } = await supabase
    .from('downloads')
    .update({
      title: material.title,
      description: material.description,
      file_url: material.fileUrl,
      file_size: material.fileSize,
      type: material.type,
      discipline_id: material.disciplineId,
      discipline_name: material.disciplineName,
      university_id: material.universityId,
      university_name: material.universityName,
      year: material.year,
      is_premium: material.isPremium
    })
    .eq('id', id);
  if (error) throw error;
};

export const deleteDownloadMaterial = async (id: string) => {
  const { error } = await supabase
    .from('downloads')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const incrementDownloadCount = async (id: string) => {
  const { error } = await supabase.rpc('increment_download_count', { material_id: id });
  if (error) {
    // Fallback if RPC doesn't exist
    const { data: current } = await supabase.from('downloads').select('download_count').eq('id', id).single();
    if (current) {
      await supabase.from('downloads').update({ download_count: (current.download_count || 0) + 1 }).eq('id', id);
    }
  }
};
