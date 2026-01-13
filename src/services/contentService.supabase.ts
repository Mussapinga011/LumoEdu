import { supabase } from '../lib/supabase';

export interface University {
  id: string;
  name: string;
  short_name: string;
}

// ... (University interface remains unchanged)

export interface Discipline {
  id: string;
  title: string;
  icon: string;
  color: string;
  university_id: string | null;
  is_active: boolean;
}

/**
 * Buscar todas as universidades
 */
export const getAllUniversities = async (): Promise<University[]> => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name');

    if (error) throw error;
    return data.map(uni => ({
      id: uni.id,
      name: uni.name,
      short_name: uni.short_name
    }));
  } catch (error) {
    console.error('Error in getAllUniversities:', error);
    throw error;
  }
};

/**
 * Buscar todas as disciplinas
 */
export const getAllDisciplines = async (): Promise<Discipline[]> => {
  try {
    const { data, error } = await supabase
      .from('disciplines')
      .select('*')
      .order('title');

    if (error) throw error;
    return data.map(disc => ({
      id: disc.id,
      title: disc.title,
      icon: disc.icon || '',
      color: disc.color || '',
      university_id: disc.university_id,
      is_active: disc.is_active
    }));
  } catch (error) {
    console.error('Error in getAllDisciplines:', error);
    throw error;
  }
};

/**
 * Buscar disciplinas por universidade
 */
export const getDisciplinesByUniversity = async (universityId: string): Promise<Discipline[]> => {
  try {
    const { data, error } = await supabase
      .from('disciplines')
      .select('*')
      .eq('university_id', universityId)
      .eq('is_active', true)
      .order('title');

    if (error) throw error;
    return data.map(disc => ({
      id: disc.id,
      title: disc.title,
      icon: disc.icon || '',
      color: disc.color || '',
      university_id: disc.university_id,
      is_active: disc.is_active
    }));
  } catch (error) {
    console.error('Error in getDisciplinesByUniversity:', error);
    throw error;
  }
};

// ... saveUniversity ...

// ... (funções anteriores mantidas)

/**
 * Salvar/Atualizar universidade (Admin)
 */
export const saveUniversity = async (university: Partial<University>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('universities')
      .upsert({
        id: university.id,
        name: university.name!,
        short_name: university.short_name!,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error in saveUniversity:', error);
    throw error;
  }
};

/**
 * Salvar/Atualizar disciplina (Admin)
 */
export const saveDiscipline = async (discipline: Partial<Discipline>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('disciplines')
      .upsert({
        id: discipline.id,
        title: discipline.title!,
        icon: discipline.icon,
        color: discipline.color,
        university_id: discipline.university_id,
        is_active: discipline.is_active ?? true,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error in saveDiscipline:', error);
    throw error;
  }
};

/**
 * Deletar universidade (Admin)
 */
export const deleteUniversity = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('universities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error in deleteUniversity:', error);
    throw error;
  }
};

/**
 * Deletar disciplina (Admin)
 */
export const deleteDiscipline = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('disciplines')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error in deleteDiscipline:', error);
    throw error;
  }
};

/**
 * Learning Sessions CRUD
 */
export const getLearningSessionsByDiscipline = async (disciplineId: string) => {
  const { data, error } = await supabase
    .from('learning_sessions')
    .select('*')
    .eq('discipline_id', disciplineId)
    .order('order_index');
  if (error) throw error;
  return data;
};

export const saveLearningSession = async (session: any) => {
  const { error } = await supabase
    .from('learning_sessions')
    .upsert({
      id: session.id,
      discipline_id: session.disciplineId,
      title: session.title,
      description: session.description,
      order_index: session.orderIndex,
      reward_xp: session.rewardXp,
      is_active: session.isActive ?? true,
      updated_at: new Date().toISOString()
    });
  if (error) throw error;
};

export const deleteLearningSession = async (id: string) => {
  const { error } = await supabase.from('learning_sessions').delete().eq('id', id);
  if (error) throw error;
};

/**
 * Learning Sections CRUD
 */
export const getLearningSectionsBySession = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('learning_sections')
    .select('*')
    .eq('session_id', sessionId)
    .order('order_index');
  if (error) throw error;
  return data;
};

export const saveLearningSection = async (section: any) => {
  const { error } = await supabase
    .from('learning_sections')
    .upsert({
      id: section.id,
      session_id: section.sessionId,
      title: section.title,
      content: section.content,
      order_index: section.orderIndex,
      updated_at: new Date().toISOString()
    });
  if (error) throw error;
};

export const deleteLearningSection = async (id: string) => {
  const { error } = await supabase.from('learning_sections').delete().eq('id', id);
  if (error) throw error;
};

/**
 * Learning Questions CRUD
 */
export const getLearningQuestionsBySession = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('learning_questions')
    .select('*')
    .eq('session_id', sessionId)
    .order('order_index');
  if (error) throw error;
  return data.map(q => ({
    ...q,
    options: q.options,
    correctOption: q.correct_option, // Mapear para camelCase se necessário
    explanation: q.explanation
  }));
};

export const saveLearningQuestion = async (question: any) => {
  const { error } = await supabase
    .from('learning_questions')
    .upsert({
      id: question.id,
      session_id: question.sessionId,
      statement: question.statement,
      options: question.options,
      correct_option: question.correctOption,
      explanation: question.explanation,
      order_index: question.orderIndex,
      updated_at: new Date().toISOString()
    });
  if (error) throw error;
};

export const deleteLearningQuestion = async (id: string) => {
  const { error } = await supabase.from('learning_questions').delete().eq('id', id);
  if (error) throw error;
};
