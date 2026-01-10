import { supabase } from '../lib/supabase';

/**
 * Buscar todos os exames
 */
export const getAllExams = async () => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*, universities(name, short_name), disciplines(title)')
      .order('year', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getAllExams:', error);
    throw error;
  }
};

/**
 * Buscar exame por ID
 */
export const getExam = async (id: string) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Buscar exames por disciplina
 */
export const getExamsByDiscipline = async (disciplineId: string) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('discipline_id', disciplineId)
    .eq('is_active', true)
    .order('year', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Buscar exames por disciplina e universidade
 */
export const getExamsByFilters = async (disciplineId: string, universityId?: string) => {
  try {
    let query = supabase
      .from('exams')
      .select('*')
      .eq('discipline_id', disciplineId)
      .eq('is_active', true);

    if (universityId) {
      query = query.eq('university_id', universityId);
    }

    const { data, error } = await query.order('year', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getExamsByFilters:', error);
    throw error;
  }
};

/**
 * Buscar questões de um exame
 */
export const getQuestionsByExam = async (examId: string) => {
  try {
    const { data, error } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in getQuestionsByExam:', error);
    throw error;
  }
};

// --- FUNÇÕES ADMIN ---

export const createExam = async (exam: any) => {
  const { data, error } = await supabase
    .from('exams')
    .insert(exam)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateExam = async (id: string, exam: any) => {
  const { error } = await supabase
    .from('exams')
    .update(exam)
    .eq('id', id);
  if (error) throw error;
};

export const deleteExam = async (examId: string) => {
  const { error } = await supabase.from('exams').delete().eq('id', examId);
  if (error) throw error;
};

export const createQuestion = async (question: any) => {
  const { data, error } = await supabase
    .from('exam_questions')
    .insert(question)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateQuestion = async (id: string, question: any) => {
  const { error } = await supabase
    .from('exam_questions')
    .update(question)
    .eq('id', id);
  if (error) throw error;
};

export const deleteQuestion = async (id: string) => {
  const { error } = await supabase
    .from('exam_questions')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

/**
 * Importar múltiplas questões
 */
export const bulkImportQuestions = async (examId: string, questions: any[]) => {
  const payload = questions.map(q => ({
    exam_id: examId,
    question_text: q.statement,
    options: q.options,
    correct_answer: typeof q.correctOption === 'number' 
      ? q.correctOption 
      : (['A', 'B', 'C', 'D', 'E'].indexOf(q.correctOption)),
    explanation: q.explanation,
    order_index: q.order,
    discipline_id: q.disciplineId
  }));

  const { error } = await supabase
    .from('exam_questions')
    .insert(payload);

  if (error) throw error;
};
