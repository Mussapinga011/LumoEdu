import { supabase } from '../lib/supabase';

/**
 * Buscar sessões (sections) de uma disciplina
 */
export const getSectionsByDiscipline = async (disciplineId: string) => {
  try {
    const { data, error } = await supabase
      .from('learning_sections')
      .select('*')
      .eq('discipline_id', disciplineId)
      .order('order_index');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getSectionsByDiscipline:', error);
    throw error;
  }
};

/**
 * Buscar etapas (steps) de uma sessão
 */
export const getSessionsBySection = async (_disciplineId: string, sectionId: string) => {
  try {
    const { data, error } = await supabase
      .from('learning_steps')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getSessionsBySection:', error);
    throw error;
  }
};

/**
 * Buscar questões de uma etapa (step)
 */
export const getQuestionsBySession = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('learning_questions')
      .select('*')
      .eq('step_id', sessionId);

    if (error) throw error;
    return data.map(q => ({
      ...q,
      question: q.question_text, // Mapear para o nome esperado no frontend
      correctAnswer: q.correct_answer // Garantir que está mapeado
    }));
  } catch (error) {
    console.error('Error in getQuestionsBySession:', error);
    throw error;
  }
};

/**
 * Salvar progresso do usuário
 */
export const saveSessionProgress = async (userId: string, progress: any) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        step_id: progress.sessionId,
        section_id: progress.sectionId,
        discipline_id: progress.disciplineId,
        completed: progress.completed,
        score: progress.score,
        streak: progress.streak,
        last_active: new Date().toISOString()
      }, {
        onConflict: 'user_id,step_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in saveSessionProgress:', error);
    throw error;
  }
};

/**
 * Buscar progresso do usuário por disciplina
 */
export const getUserProgressByDiscipline = async (userId: string, disciplineId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('step_id, completed, score, streak')
      .eq('user_id', userId)
      .eq('discipline_id', disciplineId);

    if (error) throw error;

    // Converter para o formato de objeto esperado pelo frontend { sessionId: { completed, score... } }
    const progressMap: Record<string, any> = {};
    data.forEach(item => {
      progressMap[item.step_id] = {
        completed: item.completed,
        score: item.score,
        streak: item.streak
      };
    });

    return progressMap;
  } catch (error) {
    console.error('Error in getUserProgressByDiscipline:', error);
    return {};
  }
};

// --- FUNÇÕES ADMIN ---

export const saveSection = async (section: any) => {
  const { error } = await supabase.from('learning_sections').upsert(section);
  if (error) throw error;
};

export const deleteSection = async (sectionId: string) => {
  const { error } = await supabase.from('learning_sections').delete().eq('id', sectionId);
  if (error) throw error;
};

export const saveSession = async (session: any) => {
  const { error } = await supabase.from('learning_steps').upsert(session);
  if (error) throw error;
};

export const deleteSession = async (sessionId: string) => {
  const { error } = await supabase.from('learning_steps').delete().eq('id', sessionId);
  if (error) throw error;
};

export const savePracticeQuestion = async (question: any) => {
  const { error } = await supabase.from('learning_questions').upsert({
    ...question,
    question_text: question.question // Mapear campo
  });
  if (error) throw error;
};

export const deletePracticeQuestion = async (questionId: string) => {
  const { error } = await supabase.from('learning_questions').delete().eq('id', questionId);
  if (error) throw error;
};
