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
  getDoc,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  SimulationConfig,
  SimulationQuestion,
  SimulationResult,
  UserQuestionHistory
} from '../types/simulation';
import { Question } from '../types/exam';
import { logger } from '../utils/logger';

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
      logger.dev(`Found only ${questions.length} questions for mode ${config.mode}. Filling with ${remainingCount} random questions.`);
      
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
    logger.error('Error generating simulation:', error);
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
  logger.dev('🔍 getRandomQuestions - Config:', {
    mode: config.mode,
    questionCount: config.questionCount,
    university: config.university,
    disciplines: config.disciplineIds // Assuming config.disciplines maps to config.disciplineIds
  });

  let disciplineIds: string[] = [];
  let allQuestions: Question[] = [];

  // Se disciplinas específicas foram selecionadas, usar elas
  if (config.disciplineIds && config.disciplineIds.length > 0) {
    disciplineIds = config.disciplineIds;
    logger.dev('📚 Discipline IDs to query:', disciplineIds);
  } else if (config.includeAllDisciplines) {
    disciplineIds = await getAllDisciplineIds(config.university);
    logger.dev(`📚 Fetched ${disciplineIds.length} disciplines for ${config.university}`);
  }

  // Se ainda não houver disciplinas selecionadas, buscar todas as questões disponíveis (filtradas por universidade)
  if (disciplineIds.length === 0) {
    logger.warn('⚠️ No discipline IDs specified! Fetching all questions...');
    
    // Se houver filtro de universidade, buscar disciplinas dessa universidade
    if (config.university && config.university !== 'both') {
      const allQuestionsQuery = query(
        collection(db, 'questions'),
        where('university', '==', config.university)
      );
      const allSnapshot = await getDocs(allQuestionsQuery);
      allQuestions = allSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Question));
      logger.dev(`🎯 Found ${allQuestions.length} total questions (filtered by university)`);
    } else {
      // Se nenhuma disciplina específica e nenhum filtro de universidade, buscar todas as questões
      const allQuestionsQuery = query(
        collection(db, 'questions'),
        limit(config.questionCount * 3) // Buscar mais para ter variedade
      );
      const allSnapshot = await getDocs(allQuestionsQuery);
      allQuestions = allSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Question));
      logger.dev(`🎯 Found ${allQuestions.length} total questions (no discipline or university filter)`);
    }
    return allQuestions; // Retorna as questões encontradas sem filtro de disciplina
  }

  const questionsPerDiscipline = Math.ceil(config.questionCount / disciplineIds.length);
  logger.dev(`📊 Questions per discipline: ${questionsPerDiscipline}`);
  
  // Buscar questões de cada disciplina
  const questionsPromises = disciplineIds.map(async (disciplineId) => {
    logger.dev(`🔎 Querying questions for discipline: ${disciplineId}`);
    let q = query(
      collection(db, 'questions'),
      where('disciplineId', '==', disciplineId),
      limit(questionsPerDiscipline * 2) // Buscar mais para ter variedade
    );

    if (config.university && config.university !== 'both') {
      q = query(q, where('university', '==', config.university));
    }

    const snapshot = await getDocs(q);
    logger.dev(`✅ Found ${snapshot.docs.length} questions for discipline ${disciplineId}`);
    
    // Log da estrutura das questões para debug
    if (snapshot.docs.length > 0) {
      logger.dev('📋 Sample question structure:', snapshot.docs[0].data());
    } else {
      // Se não encontrou, buscar TODAS as questões para ver a estrutura
      logger.warn('⚠️ No questions found! Fetching ALL questions to check structure...');
      const allQuestionsQuery = query(collection(db, 'questions'), limit(5));
      const allSnapshot = await getDocs(allQuestionsQuery);
      logger.dev(`📊 Total questions in database: ${allSnapshot.docs.length}`);
      if (allSnapshot.docs.length > 0) {
        logger.dev('📋 Sample question from database:', allSnapshot.docs[0].data());
        logger.dev('📋 Question ID:', allSnapshot.docs[0].id);
      }
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  });

  const questionsArrays = await Promise.all(questionsPromises);
  const finalQuestions = questionsArrays.flat();
  logger.dev(`🎯 Total questions found: ${finalQuestions.length}`);
  return finalQuestions;
};

/**
 * Salvar resultado do simulado
 */
export const saveSimulationResult = async (
  result: Omit<SimulationResult, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    // Otimização: Salvar versão leve das questões para economizar armazenamento
    const optimizedQuestions = result.questions.map(q => ({
      id: q.id,
      examId: q.examId || '',
      disciplineId: q.disciplineId || '',
      disciplineName: q.disciplineName || '',
      difficulty: q.difficulty ?? null,
      correctOption: q.correctOption || ''
    }));

    // Criar objeto sanitizado para evitar erros de fields undefined
    const simulationData = {
      userId: result.userId,
      config: {
        mode: result.config.mode,
        questionCount: result.config.questionCount,
        disciplineIds: result.config.disciplineIds,
        // Converter undefined para null ou false
        includeAllDisciplines: result.config.includeAllDisciplines ?? false,
        university: result.config.university ?? null,
        yearRange: result.config.yearRange ?? null
      },
      answers: result.answers,
      score: result.score,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      timeSpent: result.timeSpent,
      completedAt: result.completedAt,
      questions: optimizedQuestions,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, SIMULATIONS_COLLECTION), simulationData);

    // Atualizar histórico de questões
    await updateQuestionHistory(result.userId, result.questions, result.answers);

    return docRef.id;
  } catch (error) {
    logger.error('Error saving simulation result:', error);
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
  const batch = writeBatch(db);

  questions.forEach((question) => {
    const userAnswer = answers[question.id];
    if (!userAnswer) return;

    const historyId = `${userId}_${question.id}`;
    const historyRef = doc(db, QUESTION_HISTORY_COLLECTION, historyId);
    
    const wasCorrect = userAnswer === question.correctOption;

    // Usar set com merge + increment para evitar leitura prévia (economia de custos e performance)
    batch.set(historyRef, {
      userId,
      questionId: question.id,
      attempts: increment(1),
      correctAttempts: increment(wasCorrect ? 1 : 0),
      lastAttempt: Timestamp.now(),
      lastAnswer: userAnswer,
      wasCorrect
    }, { merge: true });
  });

  await batch.commit();
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
    logger.error('Error fetching question history:', error);
    return null;
  }
};

/**
 * Buscar histórico de simulados do usuário (otimizado para reduzir custos)
 */
export const getUserSimulations = async (userId: string): Promise<SimulationResult[]> => {
  try {
    logger.dev('📊 Fetching simulations for user:', userId);
    
    // Query sem orderBy para evitar necessidade de índice composto
    // A ordenação será feita no cliente
    const q = query(
      collection(db, SIMULATIONS_COLLECTION),
      where('userId', '==', userId),
      limit(20) // Buscar mais já que vamos ordenar no cliente
    );

    const snapshot = await getDocs(q);
    logger.dev(`✅ Found ${snapshot.docs.length} simulations`);
    
    const simulations = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Remover o array de questions para reduzir o tamanho dos dados
      // (economiza bandwidth e memória)
      const { questions, ...simulationData } = data;
      
      return {
        id: doc.id,
        ...simulationData,
        // Manter apenas o count de questões, não o array completo
        totalQuestions: data.totalQuestions || (questions?.length || 0),
        createdAt: data.createdAt // Garantir que createdAt está presente
      } as SimulationResult;
    });
    
    // Ordenar no cliente por createdAt (mais recente primeiro)
    const sortedSimulations = simulations.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA; // Descendente
    }).slice(0, 10); // Limitar a 10 após ordenar
    
    logger.dev('📋 Simulations loaded:', sortedSimulations.length);
    return sortedSimulations;
  } catch (error) {
    logger.error('❌ Error fetching user simulations:', error);
    return [];
  }
};

/**
 * Buscar todos os IDs de disciplinas, opcionalmente filtrados por universidade
 */
const getAllDisciplineIds = async (universityId?: string | 'both'): Promise<string[]> => {
  const snapshot = await getDocs(collection(db, 'disciplines'));
  const allDisciplines = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  if (universityId && universityId !== 'both') {
    const filtered = allDisciplines.filter((d: any) => d.universityId === universityId);
    return filtered.map((d: any) => d.id);
  }

  return allDisciplines.map((d: any) => d.id);
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
