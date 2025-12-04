import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  Timestamp,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  SimulationConfig,
  SimulationQuestion,
  SimulationResult,
  UserQuestionHistory
} from '../types/simulation';
import { Question } from '../types/exam';

const SIMULATIONS_COLLECTION = 'simulations';
const QUESTION_HISTORY_COLLECTION = 'questionHistory';

/**
 * Gerar simulado personalizado baseado na configuração
 */
export const generateSimulation = async (
  userId: string,
  config: SimulationConfig
): Promise<SimulationQuestion[]> => {
  try {
    let questions: Question[] = [];

    switch (config.mode) {
      case 'weaknesses':
        questions = await getWeaknessBasedQuestions(userId, config);
        break;
      case 'revision':
        questions = await getRevisionQuestions(userId, config);
        break;
      case 'difficult':
        questions = await getDifficultQuestions(config);
        break;
      case 'random':
      case 'custom':
      default:
        questions = await getRandomQuestions(config);
        break;
    }

    // Se não encontrou questões suficientes, completar com aleatórias
    if (questions.length < config.questionCount) {
      const remainingCount = config.questionCount - questions.length;
      console.log(`Found only ${questions.length} questions for mode ${config.mode}. Filling with ${remainingCount} random questions.`);
      
      // Evitar duplicatas: passar IDs já selecionados para excluir (se possível) ou filtrar depois
      // Como getRandomQuestions não aceita exclusão, vamos buscar mais e filtrar
      const randomQuestions = await getRandomQuestions({
        ...config,
        questionCount: (remainingCount * 2) as any // Buscar o dobro para garantir não duplicados
      });

      const existingIds = new Set(questions.map(q => q.id));
      const newQuestions = randomQuestions.filter(q => !existingIds.has(q.id));
      
      questions = [...questions, ...newQuestions];
    }

    // Embaralhar questões
    const shuffled = shuffleArray(questions);
    
    // Limitar ao número solicitado
    const selected = shuffled.slice(0, config.questionCount);

    // Buscar histórico do usuário para cada questão
    const questionsWithHistory = await Promise.all(
      selected.map(async (q) => {
        const history = await getUserQuestionHistory(userId, q.id);
        return {
          id: q.id,
          examId: q.examId,
          examName: '', // Será preenchido depois se necessário
          disciplineId: q.disciplineId,
          disciplineName: '', // Será preenchido depois se necessário
          statement: q.statement,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation,
          difficulty: q.difficulty,
          userPreviouslyAnswered: history !== null,
          userPreviouslyCorrect: history?.wasCorrect || false
        } as SimulationQuestion;
      })
    );

    return questionsWithHistory;
  } catch (error) {
    console.error('Error generating simulation:', error);
    throw error;
  }
};

/**
 * Buscar questões baseadas nas fraquezas do usuário
 */
const getWeaknessBasedQuestions = async (
  userId: string,
  config: SimulationConfig
): Promise<Question[]> => {
  // Buscar disciplinas onde usuário tem pior desempenho
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();
  const disciplineScores = userData?.disciplineScores || {};

  // Ordenar disciplinas por score (menor = mais fraca)
  const weakDisciplines = Object.entries(disciplineScores)
    .sort(([, a], [, b]) => (a as number) - (b as number))
    .slice(0, 3)
    .map(([id]) => id);

  // Se não tiver disciplinas fracas, usar as selecionadas
  const targetDisciplines = weakDisciplines.length > 0 
    ? weakDisciplines 
    : config.disciplineIds;

  // Buscar questões dessas disciplinas
  const questionsPromises = targetDisciplines.map(async (disciplineId) => {
    const q = query(
      collection(db, 'questions'),
      where('disciplineId', '==', disciplineId),
      limit(Math.ceil(config.questionCount / targetDisciplines.length))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  });

  const questionsArrays = await Promise.all(questionsPromises);
  return questionsArrays.flat();
};

/**
 * Buscar questões que o usuário errou anteriormente
 */
const getRevisionQuestions = async (
  userId: string,
  config: SimulationConfig
): Promise<Question[]> => {
  // Buscar histórico de questões erradas
  const historyQuery = query(
    collection(db, QUESTION_HISTORY_COLLECTION),
    where('userId', '==', userId),
    where('wasCorrect', '==', false),
    orderBy('lastAttempt', 'desc'),
    limit(config.questionCount * 2) // Buscar mais para ter opções
  );

  const historySnapshot = await getDocs(historyQuery);
  const wrongQuestionIds = historySnapshot.docs.map(doc => doc.data().questionId);

  if (wrongQuestionIds.length === 0) {
    // Se não tiver questões erradas, retornar questões aleatórias
    return getRandomQuestions(config);
  }

  // Buscar as questões
  const questions: Question[] = [];
  for (const questionId of wrongQuestionIds) {
    const questionDoc = await getDoc(doc(db, 'questions', questionId));
    if (questionDoc.exists()) {
      questions.push({ id: questionDoc.id, ...questionDoc.data() } as Question);
    }
  }

  return questions;
};

/**
 * Buscar questões difíceis (que a maioria erra)
 */
const getDifficultQuestions = async (
  config: SimulationConfig
): Promise<Question[]> => {
  // Por enquanto, buscar questões com difficulty >= 4
  // No futuro, pode calcular baseado em estatísticas reais
  const disciplineQueries = config.disciplineIds.map(disciplineId =>
    query(
      collection(db, 'questions'),
      where('disciplineId', '==', disciplineId),
      where('difficulty', '>=', 4),
      limit(Math.ceil(config.questionCount / config.disciplineIds.length))
    )
  );

  const snapshots = await Promise.all(disciplineQueries.map(q => getDocs(q)));
  const questions = snapshots.flatMap(snapshot =>
    snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question))
  );

  // Se não tiver questões difíceis suficientes, complementar com aleatórias
  if (questions.length < config.questionCount) {
    const randomQuestions = await getRandomQuestions({
      ...config,
      questionCount: (config.questionCount - questions.length) as any
    });
    questions.push(...randomQuestions);
  }

  return questions;
};

/**
 * Buscar questões aleatórias
 */
const getRandomQuestions = async (
  config: SimulationConfig
): Promise<Question[]> => {
  const disciplineIds = config.includeAllDisciplines 
    ? await getAllDisciplineIds() 
    : config.disciplineIds;

  const questionsPerDiscipline = Math.ceil(config.questionCount / disciplineIds.length);

  const questionsPromises = disciplineIds.map(async (disciplineId) => {
    const q = query(
      collection(db, 'questions'),
      where('disciplineId', '==', disciplineId),
      limit(questionsPerDiscipline * 2) // Buscar mais para ter variedade
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  });

  const questionsArrays = await Promise.all(questionsPromises);
  return questionsArrays.flat();
};

/**
 * Salvar resultado do simulado
 */
export const saveSimulationResult = async (
  result: Omit<SimulationResult, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, SIMULATIONS_COLLECTION), {
      ...result,
      createdAt: Timestamp.now()
    });

    // Atualizar histórico de questões
    await updateQuestionHistory(result.userId, result.questions, result.answers);

    return docRef.id;
  } catch (error) {
    console.error('Error saving simulation result:', error);
    throw error;
  }
};

/**
 * Atualizar histórico de questões do usuário
 */
const updateQuestionHistory = async (
  userId: string,
  questions: SimulationQuestion[],
  answers: Record<string, string>
): Promise<void> => {
  const updates = questions.map(async (question) => {
    const userAnswer = answers[question.id];
    if (!userAnswer) return;

    const historyId = `${userId}_${question.id}`;
    const historyRef = doc(db, QUESTION_HISTORY_COLLECTION, historyId);
    const historyDoc = await getDoc(historyRef);

    const wasCorrect = userAnswer === question.correctOption;

    if (historyDoc.exists()) {
      const data = historyDoc.data() as UserQuestionHistory;
      await setDoc(historyRef, {
        ...data,
        attempts: data.attempts + 1,
        correctAttempts: data.correctAttempts + (wasCorrect ? 1 : 0),
        lastAttempt: Timestamp.now(),
        lastAnswer: userAnswer,
        wasCorrect
      });
    } else {
      await setDoc(historyRef, {
        userId,
        questionId: question.id,
        attempts: 1,
        correctAttempts: wasCorrect ? 1 : 0,
        lastAttempt: Timestamp.now(),
        lastAnswer: userAnswer,
        wasCorrect
      } as UserQuestionHistory);
    }
  });

  await Promise.all(updates);
};

/**
 * Buscar histórico de uma questão específica
 */
const getUserQuestionHistory = async (
  userId: string,
  questionId: string
): Promise<UserQuestionHistory | null> => {
  try {
    const historyId = `${userId}_${questionId}`;
    const historyDoc = await getDoc(doc(db, QUESTION_HISTORY_COLLECTION, historyId));
    
    if (historyDoc.exists()) {
      return historyDoc.data() as UserQuestionHistory;
    }
    return null;
  } catch (error) {
    console.error('Error fetching question history:', error);
    return null;
  }
};

/**
 * Buscar histórico de simulados do usuário
 */
export const getUserSimulations = async (userId: string): Promise<SimulationResult[]> => {
  try {
    const q = query(
      collection(db, SIMULATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SimulationResult[];
  } catch (error) {
    console.error('Error fetching user simulations:', error);
    return [];
  }
};

/**
 * Buscar todos os IDs de disciplinas
 */
const getAllDisciplineIds = async (): Promise<string[]> => {
  const snapshot = await getDocs(collection(db, 'disciplines'));
  return snapshot.docs.map(doc => doc.id);
};

/**
 * Embaralhar array (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
