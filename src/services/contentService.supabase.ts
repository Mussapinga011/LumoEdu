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
/**
 * Learning Contents (Teoria) CRUD
 * Agora usando a tabela correta 'learning_contents'
 */
export const getLearningSectionsBySession = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('learning_contents')
    .select('*')
    .eq('step_id', sessionId)
    .order('order_index');
  if (error) throw error;
  return data;
};

export const saveLearningSection = async (section: any) => {
  const { error } = await supabase
    .from('learning_contents')
    .upsert({
      id: section.id,
      step_id: section.sessionId, // Mapeando sessionId do front para step_id do banco
      title: section.title,
      content: section.content,
      order_index: section.orderIndex,
      updated_at: new Date().toISOString()
    });
  if (error) throw error;
};

export const deleteLearningSection = async (id: string) => {
  const { error } = await supabase.from('learning_contents').delete().eq('id', id);
  if (error) throw error;
};

/**
 * Learning Questions CRUD
 */
export const getLearningQuestionsBySession = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('learning_questions')
    .select('*')
    .eq('step_id', sessionId) // step_id em vez de session_id
    .order('order_index');
  if (error) throw error;
  return data.map(q => ({
    ...q,
    id: q.id,
    sessionId: q.step_id,
    statement: q.question_text, // question_text no banco
    options: q.options,
    correctOption: q.correct_answer, // correct_answer no banco
    explanation: q.explanation,
    order_index: q.order_index
  }));
};

export const saveLearningQuestion = async (question: any) => {
  const { error } = await supabase
    .from('learning_questions')
    .upsert({
      id: question.id,
      step_id: question.sessionId, // step_id no banco
      question_text: question.statement, // question_text no banco
      options: question.options,
      correct_answer: question.correctOption, // correct_answer no banco
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
