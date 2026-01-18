import { supabase } from '../lib/supabase';
import { PREPARATION_MILESTONES, PreparationMilestone } from '../types/milestone';
import { translateDiscipline } from '../utils/formatters';

/**
 * Serviço de Marcos de Preparação (Milesones)
 * Focado em avaliar a prontidão técnica do estudante, não em gamificação.
 */

interface UserStats {
  totalQuestionsAnswered: number;
  examsCompleted: number;
  simulationsCompleted: number;
  averageScore: number;
  questionsPerDiscipline?: Record<string, number>;
  studyPlanSubjects?: string[]; // IDs das disciplinas do plano (ex: ['math', 'physics'])
  studyStreak?: number;
  syllabusCoverage?: Record<string, number>; // % de cobertura por disciplina
}

/**
 * Verifica e atualiza os marcos do usuário com base nas estatísticas atuais.
 */
export const checkAndUpdateMilestones = async (userId: string, currentStats: UserStats): Promise<PreparationMilestone[]> => {
  try {
    const { data: existingMilestones, error } = await supabase
      .from('user_milestones')
      .select('milestone_id')
      .eq('user_id', userId);

    if (error) throw error;

    const achievedIds = new Set(existingMilestones?.map((m: any) => m.milestone_id) || []);
    const newMilestones: PreparationMilestone[] = [];

    for (const milestone of PREPARATION_MILESTONES) {
      if (achievedIds.has(milestone.id)) continue;

      // Se o marco for dinâmico e a disciplina não estiver no plano, pulamos
      if (isMilestoneIrrelevant(milestone, currentStats)) continue;

      if (evaluateRequirement(milestone, currentStats)) {
        await saveMilestone(userId, milestone.id);
        newMilestones.push(milestone);
      }
    }

    return newMilestones;
  } catch (error) {
    console.error('Erro ao verificar milestones:', error);
    return [];
  }
};

/**
 * Verifica se um marco é irrelevante para o plano de estudo atual do aluno
 */
export const isMilestoneIrrelevant = (milestone: PreparationMilestone, stats: UserStats): boolean => {
  const disciplineId = milestone.requirement.disciplineId;
  if (!disciplineId) return false;

  if (disciplineId.startsWith('dynamic_subject_')) {
    const index = parseInt(disciplineId.split('_')[2]) - 1;
    // Se o aluno não tem tantas disciplinas no plano, este marco é irrelevante
    return !stats.studyPlanSubjects || !stats.studyPlanSubjects[index];
  }

  // Se for uma disciplina fixa (ex: 'portuguese'), mas estiver fora do plano
  if (stats.studyPlanSubjects && stats.studyPlanSubjects.length > 0 && !stats.studyPlanSubjects.includes(disciplineId)) {
    return true;
  }

  return false;
};

/**
 * Retorna os dados de exibição formatados para marcos dinâmicos
 */
export const getMilestoneDisplayData = (milestone: PreparationMilestone, stats: UserStats) => {
  let { name, description } = milestone;
  const disciplineId = milestone.requirement.disciplineId;

  if (disciplineId?.startsWith('dynamic_subject_')) {
    const index = parseInt(disciplineId.split('_')[2]) - 1;
    const realDisciplineId = stats.studyPlanSubjects?.[index];
    
    const disciplineName = realDisciplineId ? translateDiscipline(realDisciplineId) : 'Disciplina';

    name = name.replace(/Disciplina Nuclear (I|II)/, disciplineName);
    description = description.replace(/sua (1ª|2ª) disciplina principal/, disciplineName);
  }

  return { name, description };
};

/**
 * Avalia se um requisito específico foi atendido
 */
const evaluateRequirement = (milestone: PreparationMilestone, stats: UserStats): boolean => {
  const req = milestone.requirement;
  let targetDisciplineId = req.disciplineId;

  // Mapear disciplina dinâmica para real
  if (targetDisciplineId?.startsWith('dynamic_subject_')) {
    const index = parseInt(targetDisciplineId.split('_')[2]) - 1;
    targetDisciplineId = stats.studyPlanSubjects?.[index];
  }

  switch (req.type) {
    case 'questions_count':
      if (targetDisciplineId && stats.questionsPerDiscipline) {
        return (stats.questionsPerDiscipline[targetDisciplineId] || 0) >= req.value;
      }
      return stats.totalQuestionsAnswered >= req.value;

    case 'exams_completed':
      return stats.examsCompleted >= req.value;

    case 'simulation_count':
      return stats.simulationsCompleted >= req.value;

    case 'study_streak':
      return (stats.studyStreak || 0) >= req.value;

    case 'average_score':
      return stats.examsCompleted >= 3 && stats.averageScore >= req.value;

    case 'syllabus_coverage':
      if (targetDisciplineId && stats.syllabusCoverage) {
        return (stats.syllabusCoverage[targetDisciplineId] || 0) >= req.value;
      }
      // Se não houver dID, calcula média geral da cobertura
      if (stats.syllabusCoverage) {
        const values = Object.values(stats.syllabusCoverage);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return avg >= req.value;
      }
      return false; 

    default:
      return false;
  }
};

/**
 * Persiste o marco no banco de dados
 */
const saveMilestone = async (userId: string, milestoneId: string) => {
  // Usamos 'user_milestones' para no quebrar o banco existente,
  // mas logicamente estamos salvando um milestone.
  const { error } = await supabase
    .from('user_milestones')
    .insert({
      user_id: userId,
      milestone_id: milestoneId,
      earned_at: new Date().toISOString()
    });

  if (error && error.code !== '23505') { // Ignora erro de duplicata
    console.error('Erro ao salvar milestone:', error);
  }
};

/**
 * Retorna o progresso para um milestone específico (0 a 100)
 * Útil para UI de checklist (ex: "80/100 questões")
 */
export const getMilestoneProgress = (milestone: PreparationMilestone, stats: UserStats): number => {
  const req = milestone.requirement;
  let current = 0;

  switch (req.type) {
    case 'questions_count':
      current = req.disciplineId && stats.questionsPerDiscipline 
        ? (stats.questionsPerDiscipline[req.disciplineId] || 0) 
        : stats.totalQuestionsAnswered;
      break;
    case 'exams_completed':
      current = stats.examsCompleted;
      break;
    case 'simulation_count':
      current = stats.simulationsCompleted;
      break;
    case 'average_score':
      current = stats.averageScore;
      break;
    default:
      return 0;
  }

  const progress = (current / req.value) * 100;
  return Math.min(100, Math.floor(progress));
};
