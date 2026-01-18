import { supabase } from '../lib/supabase';
import { SimulationConfig, SimulationQuestion } from '../types/simulation';

/**
 * Gerar simulado baseado na configuração
 */
// export const generateSimulation = async (userId: string, config: SimulationConfig): Promise<SimulationQuestion[]> => {
export const generateSimulation = async (_userId: string, config: SimulationConfig): Promise<SimulationQuestion[]> => {
  try {
    // 1. Lógica por Modo de Simulado
    if (config.mode === 'revision' || config.mode === 'weaknesses') {
      // Buscar questões que o usuário errou anteriormente
      // Por enquanto, como não temos tabela de "log de erros por questão" fácil, vamos simular
      // Ou buscar do user_simulations (answers) seria muito complexo para este wrapper simples
      // Vamos manter a lógica padrão de filtro por enquanto, mas idealmente aqui faríamos uma query complexa
      // Para MVP: "weaknesses" e "revision" vão se comportar como Random mas focados nas disciplinas selecionadas
    }

    // 2. Montar Query Principal
    let query = supabase
      .from('exam_questions')
      .select(`
        id,
        statement:question_text,
        options,
        correctOption:correct_answer,
        explanation,
        exams!inner(title, id, discipline_id, university_id)
      `);

    // 3. Aplicar Filtros Rígidos
    if (config.disciplineIds && config.disciplineIds.length > 0) {
      query = query.in('exams.discipline_id', config.disciplineIds);
    } else if (config.disciplineId && config.disciplineId !== 'all') {
      query = query.eq('exams.discipline_id', config.disciplineId);
    }

    if (config.universityId && config.universityId !== 'all') {
      query = query.eq('exams.university_id', config.universityId);
    }

    // Filtro de Dificuldade (simulado, pois não temos coluna real)
    // Se tivéssemos coluna 'difficulty', seria:
    // if (config.mode === 'difficult') query = query.gte('difficulty', 3);

    // 4. Limitar busca (busca um pouco mais para garantir aleatoriedade)
    const { data, error } = await query.limit(100); 

    if (error) throw error;
    
    if (!data || data.length === 0) {
       return [];
    }

    // 5. Filtragem Estrita no Cliente (Double Check)
    let filteredData = data;
    
    if (config.universityId && config.universityId !== 'all') {
       filteredData = filteredData.filter((q: any) => q.exams.university_id === config.universityId);
    }
    
    if (config.disciplineIds && config.disciplineIds.length > 0) {
       filteredData = filteredData.filter((q: any) => config.disciplineIds?.includes(q.exams.discipline_id));
    }

    // 6. Embaralhar e Selecionar
    const shuffled = [...filteredData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, config.questionCount);

    return selected.map((q: any) => ({
      id: q.id,
      examId: q.exams?.id || '',
      examName: q.exams?.title || 'Exame Individual',
      disciplineId: q.exams?.discipline_id,
      disciplineName: 'Disciplina', 
      statement: q.statement,
      options: q.options,
      correctOption: q.options[q.correctOption], 
      explanation: q.explanation,
      difficulty: 2, 
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
