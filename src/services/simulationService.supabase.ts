import { supabase } from '../lib/supabase';
import { SimulationConfig, SimulationQuestion } from '../types/simulation';

/**
 * Gerar simulado baseado na configuração
 */
export const generateSimulation = async (_userId: string, config: SimulationConfig): Promise<SimulationQuestion[]> => {
  try {
    let query = supabase
      .from('exam_questions')
      .select(`
        id,
        statement:question_text,
        options,
        correctOption:correct_answer,
        explanation,
        difficulty,
        discipline_id,
        exams(title, id)
      `);

    if (config.disciplineId && config.disciplineId !== 'all') {
      query = query.eq('discipline_id', config.disciplineId);
    }

    const { data, error } = await query.limit(config.questionCount * 2);

    if (error) throw error;

    // Embaralhar no cliente
    const shuffled = [...(data || [])].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, config.questionCount);

    return selected.map((q: any) => ({
      id: q.id,
      examId: q.exams?.id || '',
      examName: q.exams?.title || 'Exame Individual',
      disciplineId: q.discipline_id,
      disciplineName: 'Disciplina', // Default fallback
      statement: q.statement,
      options: q.options,
      correctOption: q.options[q.correctOption], 
      explanation: q.explanation,
      difficulty: q.difficulty,
      userPreviouslyAnswered: false,
      userPreviouslyCorrect: false
    }));
  } catch (error) {
    console.error('Error in generateSimulation:', error);
    throw error;
  }
};

/**
 * Salvar resultado do simulado
 */
export const saveSimulationResult = async (result: any) => {
  try {
    const { data, error } = await supabase
      .from('user_simulations')
      .insert({
        user_id: result.userId,
        config: result.config,
        score: result.score,
        correct_count: result.correctCount,
        total_questions: result.totalQuestions,
        time_spent: result.timeSpent,
        answers: result.answers,
        questions_summary: result.questions.map((q: any) => ({ id: q.id, correct: q.correctOption }))
      })
      .select()
      .single();

    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('Error in saveSimulationResult:', error);
    throw error;
  }
};

/**
 * Buscar histórico de simulados
 */
export const getUserSimulations = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_simulations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(s => ({
      id: s.id,
      userId: s.user_id,
      config: s.config,
      score: s.score,
      correctCount: s.correct_count,
      totalQuestions: s.total_questions,
      timeSpent: s.time_spent,
      answers: s.answers,
      createdAt: s.created_at
    }));
  } catch (error) {
    console.error('Error in getUserSimulations:', error);
    return [];
  }
};
