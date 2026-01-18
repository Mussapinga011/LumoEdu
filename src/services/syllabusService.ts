import { supabase } from '../lib/supabase';

export interface DisciplineCoverage {
  disciplineId: string;
  disciplineTitle: string;
  totalTopics: number;
  completedTopics: number;
  percentage: number;
}

/**
 * Calcula a cobertura do edital (syllabus) para as disciplinas do plano de estudo do aluno.
 * Compara o total de 'learning_steps' disponíveis com os 'completed' em 'user_progress'.
 */
export const getSyllabusCoverage = async (userId: string, targetDisciplineIds: string[]): Promise<DisciplineCoverage[]> => {
  try {
    if (!targetDisciplineIds || targetDisciplineIds.length === 0) return [];

    // 1. Buscar total de tópicos (steps) por disciplina
    const { data: totalTopicsData, error: totalError } = await supabase
      .from('learning_steps')
      .select('id, section_id, learning_sections!inner(discipline_id, title)')
      .in('learning_sections.discipline_id', targetDisciplineIds);

    if (totalError) throw totalError;

    // 2. Buscar tópicos concluídos pelo usuário
    const { data: completedData, error: completedError } = await supabase
      .from('user_progress')
      .select('step_id, discipline_id')
      .eq('user_id', userId)
      .eq('completed', true)
      .in('discipline_id', targetDisciplineIds);

    if (completedError) throw completedError;

    // 3. Agrupar e Calcular
    const coverage: DisciplineCoverage[] = targetDisciplineIds.map(dId => {
      const disciplineTopics = totalTopicsData?.filter((t: any) => {
        const ls = Array.isArray(t.learning_sections) ? t.learning_sections[0] : t.learning_sections;
        return ls?.discipline_id === dId;
      }) || [];

      const completedTopics = completedData?.filter((c: any) => c.discipline_id === dId) || [];
      
      const total = disciplineTopics.length;
      const completed = completedTopics.length;
      
      // Encontrar o título da disciplina
      const firstTopic = disciplineTopics[0] as any;
      const ls = Array.isArray(firstTopic?.learning_sections) ? firstTopic.learning_sections[0] : firstTopic?.learning_sections;
      const disciplineTitle = ls?.title || dId;

      return {
        disciplineId: dId,
        disciplineTitle: disciplineTitle,
        totalTopics: total,
        completedTopics: completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });

    return coverage;
  } catch (error) {
    console.error('Erro ao calcular cobertura do edital:', error);
    return [];
  }
};
