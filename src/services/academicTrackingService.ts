import { supabase } from '../lib/supabase';
import type {
  StudentAcademicProfile,
  TopicProgress,
  PerformanceRecord,
  ContentRecommendation,
  PerformanceAnalysis,
  KnowledgeGap,
  DailyGoal,
  Achievement
} from '../types/academicTracking';

/**
 * Serviço de Tracking de Progresso Acadêmico
 * Gerencia todo o acompanhamento inteligente do estudante
 */
export class AcademicTrackingService {
  
  // ============================================
  // PERFIL ACADÊMICO
  // ============================================
  
  /**
   * Obter perfil acadêmico do estudante
   */
  static async getStudentProfile(userId: string): Promise<StudentAcademicProfile | null> {
    const { data, error } = await supabase
      .from('student_academic_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching student profile:', error);
      return null;
    }

    if (!data) return null;
    
    return this.mapProfileFromDB(data);
  }
  
  /**
   * Criar ou atualizar perfil acadêmico
   */
  static async upsertStudentProfile(profile: Partial<StudentAcademicProfile>): Promise<void> {
    const dbProfile = this.mapProfileToDB(profile);
    
    const { error } = await supabase
      .from('student_academic_profiles')
      .upsert(dbProfile, { onConflict: 'user_id' });
    
    if (error) {
      console.error('Error upserting student profile:', error);
      throw error;
    }
  }
  
  // ============================================
  // PROGRESSO POR TÓPICO
  // ============================================
  
  /**
   * Obter progresso em todos os tópicos
   */
  static async getTopicProgress(userId: string): Promise<TopicProgress[]> {
    const { data, error } = await supabase
      .from('topic_progress')
      .select(`
        *,
        topic:syllabus_topics(*)
      `)
      .eq('user_id', userId)
      .order('last_studied', { ascending: false });
    
    if (error) {
      console.error('Error fetching topic progress:', error);
      return [];
    }
    
    return data.map(this.mapTopicProgressFromDB);
  }
  
  /**
   * Atualizar progresso em um tópico
   */
  static async updateTopicProgress(
    userId: string,
    topicId: string,
    update: Partial<TopicProgress>
  ): Promise<void> {
    const { error } = await supabase
      .from('topic_progress')
      .upsert({
        user_id: userId,
        topic_id: topicId,
        ...update,
        last_studied: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,topic_id' });
    
    if (error) {
      console.error('Error updating topic progress:', error);
      throw error;
    }
  }
  
  /**
   * Registrar sessão de estudo
   */
  static async recordStudySession(
    userId: string,
    disciplineId: string,
    session: {
      score: number;
      questionsAnswered: number;
      correctAnswers: number;
      timeSpent: number;
      topicsStudied: string[];
    }
  ): Promise<void> {
    // 1. Salvar no histórico
    const { error: historyError } = await supabase
      .from('performance_history')
      .insert({
        user_id: userId,
        discipline_id: disciplineId,
        session_date: new Date().toISOString().split('T')[0],
        score: session.score,
        questions_answered: session.questionsAnswered,
        correct_answers: session.correctAnswers,
        time_spent: session.timeSpent,
        topics_studied: session.topicsStudied
      });
    
    if (historyError) {
      console.error('Error recording study session:', historyError);
      throw historyError;
    }
    
    // 2. Atualizar progresso dos tópicos
    for (const topicId of session.topicsStudied) {
      await this.updateTopicProgress(userId, topicId, {
        questionsAnswered: session.questionsAnswered,
        correctAnswers: session.correctAnswers,
        timeSpent: session.timeSpent,
        score: session.score
      } as any);
    }
    
    // 3. Atualizar perfil acadêmico
    await this.incrementProfileStats(userId, {
      totalStudyTime: session.timeSpent,
      totalQuestionsAnswered: session.questionsAnswered
    });
    
    // 4. Atualizar meta diária
    await this.updateDailyGoal(userId, {
      questionsSolved: session.questionsAnswered,
      minutesStudied: session.timeSpent
    });
  }
  
  // ============================================
  // HISTÓRICO DE PERFORMANCE
  // ============================================
  
  /**
   * Obter histórico de performance
   */
  static async getPerformanceHistory(
    userId: string,
    days: number = 30
  ): Promise<PerformanceRecord[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('performance_history')
      .select(`
        *,
        discipline:disciplines(id, title)
      `)
      .eq('user_id', userId)
      .gte('session_date', startDate.toISOString().split('T')[0])
      .order('session_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching performance history:', error);
      return [];
    }
    
    return data.map(this.mapPerformanceRecordFromDB);
  }
  
  // ============================================
  // ANÁLISE DE PERFORMANCE
  // ============================================
  
  /**
   * Analisar performance do estudante
   */
  static async analyzePerformance(userId: string): Promise<PerformanceAnalysis | null> {
    // Verificar cache primeiro
    const cached = await this.getPerformanceCache(userId);
    if (cached && new Date(cached.analyzedAt) > new Date(Date.now() - 3600000)) {
      return cached;
    }
    
    // Calcular nova análise
    const [profile, topicProgress, history] = await Promise.all([
      this.getStudentProfile(userId),
      this.getTopicProgress(userId),
      this.getPerformanceHistory(userId, 30)
    ]);
    
    if (!profile) return null;
    
    const analysis: PerformanceAnalysis = {
      userId,
      analyzedAt: new Date(),
      overallScore: profile.overallAccuracy,
      disciplineScores: this.calculateDisciplineScores(topicProgress),
      trend: this.calculateTrend(history),
      improvementRate: this.calculateImprovementRate(history),
      readinessScore: this.calculateReadinessScore(topicProgress),
      estimatedAdmissionChance: this.estimateAdmissionChance(profile.overallAccuracy, topicProgress),
      daysUntilReady: this.estimateDaysUntilReady(topicProgress),
      strengths: this.identifyStrengths(topicProgress),
      weaknesses: this.identifyWeaknesses(topicProgress),
      commonMistakes: [],
      insights: this.generateInsights(profile, topicProgress),
      recommendations: (await this.getRecommendations(userId)).map(r => r.reason)
    };
    
    // Salvar no cache
    await this.savePerformanceCache(userId, analysis);
    
    return analysis;
  }
  
  /**
   * Identificar lacunas de conhecimento
   */
  static async identifyKnowledgeGaps(userId: string): Promise<KnowledgeGap[]> {
    const profile = await this.getStudentProfile(userId);
    if (!profile) return [];
    
    const topicProgress = await this.getTopicProgress(userId);
    
    // Obter tópicos do curso alvo
    const { data: courseReqs } = await supabase
      .from('course_requirements')
      .select('*, disciplines')
      .eq('course_name', profile.targetCourse)
      .single();
    
    if (!courseReqs) return [];
    
    const gaps: KnowledgeGap[] = [];
    
    // Para cada disciplina requerida
    for (const disc of (courseReqs.disciplines as any[])) {
      const { data: topics } = await supabase
        .from('syllabus_topics')
        .select('*')
        .eq('discipline_id', disc.disciplineId);
      
      if (!topics) continue;
      
      for (const topic of topics) {
        const progress = topicProgress.find(p => p.topicId === topic.id);
        
        // Se não estudou ou score baixo
        if (!progress || progress.score < 60) {
          gaps.push({
            topicId: topic.id,
            topicName: topic.topic_name,
            disciplineId: disc.disciplineId,
            priority: topic.importance <= 2 ? 'high' : 'medium',
            severity: progress ? 100 - progress.score : 100,
            estimatedTimeToFix: topic.estimated_hours,
            recommendedContent: []
          });
        }
      }
    }
    
    return gaps.sort((a, b) => b.severity - a.severity);
  }
  
  // ============================================
  // RECOMENDAÇÕES
  // ============================================
  
  /**
   * Obter recomendações personalizadas
   */
  static async getRecommendations(userId: string): Promise<ContentRecommendation[]> {
    const { data, error } = await supabase
      .from('content_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
    
    return data.map(this.mapRecommendationFromDB);
  }
  
  /**
   * Gerar novas recomendações com SRS (Repetição Espaçada)
   */
  static async generateRecommendations(userId: string): Promise<void> {
    const gaps = await this.identifyKnowledgeGaps(userId);
    const progress = await this.getTopicProgress(userId);
    
    // 1. REVISÃO ESPAÇADA (SRS)
    // Tópicos dominados mas antigos
    const now = new Date();
    const reviewCandidates = progress.filter(p => {
      if (!p.lastStudied) return false;
      const daysSince = (now.getTime() - p.lastStudied.getTime()) / (1000 * 3600 * 24);
      
      if (p.score >= 90) return daysSince > 30; // Review após 30 dias
      if (p.score >= 80) return daysSince > 14; // Review após 14 dias
      if (p.score >= 70) return daysSince > 7;  // Review após 7 dias
      return false;
    });

    // 2. RECOMENDAÇÕES PRIORITÁRIAS (Lacunas Urgentes)
    const recommendationsToInsert: any[] = [];

    // Prioridade 1: Revisão Espaçada (Evitar esquecimento)
    for (const p of reviewCandidates.slice(0, 2)) {
      recommendationsToInsert.push({
        user_id: userId,
        type: 'review',
        priority: 'high',
        content_id: p.topicId,
        content_type: 'topic',
        content_title: `Revisão de ${p.topic?.topic_name || 'Tópico'}`,
        topic_id: p.topicId,
        estimated_time: 15,
        difficulty: 3,
        reason: `Revisão Espaçada: Você não vê isso há algum tempo!`,
        expected_impact: 10
      });
    }

    // Prioridade 2: Lacunas de Conhecimento
    for (const gap of gaps.slice(0, 3)) {
       // Buscar conteúdo ESPECÍFICO do tópico
       const { data: sessions } = await supabase
        .from('learning_steps')
        .select('*')
        .eq('topic_id', gap.topicId) // Filtro por tópico!
        .limit(1);

       // Fallback: Se não achar por ID, tenta por texto
       let session = sessions?.[0];
       if (!session) {
          const { data: fallback } = await supabase.from('learning_steps')
            .select('*')
            .ilike('title', `%${gap.topicName}%`)
            .limit(1);
          session = fallback?.[0];
       }

       if (session) {
        recommendationsToInsert.push({
            user_id: userId,
            type: 'theory',
            priority: gap.priority,
            content_id: session.id,
            content_type: 'session',
            content_title: session.title,
            topic_id: gap.topicId,
            estimated_time: gap.estimatedTimeToFix * 60,
            difficulty: 3,
            reason: `Você precisa fortalecer ${gap.topicName}`,
            expected_impact: gap.severity
        });
       }
    }

    // Salvar recomendações
    if (recommendationsToInsert.length > 0) {
        const { error } = await supabase
            .from('content_recommendations')
            .insert(recommendationsToInsert);
        
        if (error) console.error('Error saving SRS recommendations:', error);
    }
  }

  // ============================================
  // METAS DIÁRIAS
  // ============================================
  
  /**
   * Obter meta diária
   */
  static async getDailyGoal(userId: string, date?: Date): Promise<DailyGoal | null> {
    const goalDate = date || new Date();
    const dateStr = goalDate.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_date', dateStr)
      .single();
    
    if (error) {
      return this.createDailyGoal(userId, goalDate);
    }
    
    return this.mapDailyGoalFromDB(data);
  }

  /**
   * Criar meta diária adaptativa com "Recovery Mode"
   */
  static async createDailyGoal(userId: string, date: Date): Promise<DailyGoal> {
    const profile = await this.getStudentProfile(userId);
    const history = await this.getPerformanceHistory(userId, 7);
    
    // Buscar metas recentes para verificar consistência
    const { data: recentGoals } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', userId)
        .order('goal_date', { ascending: false })
        .limit(3);

    // ANALISAR ESTADO DO ALUNO
    let baseQuestions = 10;
    let baseTime = 30;

    // Histórico base
    if (history.length > 0) {
        baseQuestions = Math.round(history.reduce((sum, h) => sum + h.questionsAnswered, 0) / history.length);
        baseTime = Math.round(history.reduce((sum, h) => sum + h.timeSpent, 0) / history.length);
    }

    // AJUSTE ADAPTATIVO
    if (recentGoals && recentGoals.length >= 3) {
        const allFailed = recentGoals.every((g: any) => g.completion_rate < 50);
        const allCrushed = recentGoals.every((g: any) => g.completion_rate >= 100);

        if (allFailed) {
            baseQuestions = Math.max(5, Math.floor(baseQuestions * 0.7)); // Reduz 30%
            baseTime = Math.max(15, Math.floor(baseTime * 0.7));
        } else if (allCrushed) {
            baseQuestions = Math.floor(baseQuestions * 1.2); // Aumenta 20%
            baseTime = Math.floor(baseTime * 1.1);
        }
    }

    // Garantir mínimos e máximos saudáveis
    baseQuestions = Math.max(5, Math.min(baseQuestions, 50));
    baseTime = Math.max(15, Math.min(baseTime, 120));

    const goal: DailyGoal = {
      date,
      questionsToSolve: baseQuestions,
      minutesToStudy: baseTime,
      topicsToReview: profile?.weakTopics.slice(0, 2) || [],
      isCompleted: false,
      completionRate: 0
    };
    
    const { data, error } = await supabase
      .from('daily_goals')
      .upsert({
        user_id: userId,
        goal_date: date.toISOString().split('T')[0],
        questions_to_solve: goal.questionsToSolve,
        minutes_to_study: goal.minutesToStudy,
        topics_to_review: goal.topicsToReview
      }, { onConflict: 'user_id,goal_date' })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating daily goal:', error);
      return goal;
    }
    
    return this.mapDailyGoalFromDB(data);
  }
  
  /**
   * Atualizar meta diária
   */
  static async updateDailyGoal(
    userId: string,
    update: { questionsSolved?: number; minutesStudied?: number }
  ): Promise<void> {
    const goal = await AcademicTrackingService.getDailyGoal(userId);
    if (!goal) return;
    
    const newQuestionsSolved = (goal.isCompleted ? 0 : update.questionsSolved) || 0;
    const newMinutesStudied = (goal.isCompleted ? 0 : update.minutesStudied) || 0;
    
    const completionRate = Math.min(100, Math.round(
      ((newQuestionsSolved / goal.questionsToSolve) * 50) +
      ((newMinutesStudied / goal.minutesToStudy) * 50)
    ));
    
    await supabase
      .from('daily_goals')
      .update({
        questions_solved: newQuestionsSolved,
        minutes_studied: newMinutesStudied,
        completion_rate: completionRate,
        is_completed: completionRate >= 100
      })
      .eq('user_id', userId)
      .eq('goal_date', goal.date.toISOString().split('T')[0]);
  }
  
  // ============================================
  // CONQUISTAS
  // ============================================
  
  /**
   * Verificar e desbloquear conquistas
   */
  static async checkAchievements(userId: string): Promise<Achievement[]> {
    const profile = await this.getStudentProfile(userId);
    if (!profile) return [];
    
    const newAchievements: Achievement[] = [];
    
    // Conquista: Primeira Questão
    if (profile.totalQuestionsAnswered === 1) {
      newAchievements.push(await this.unlockAchievement(userId, {
        type: 'questions_solved',
        title: 'Primeira Questão',
        description: 'Resolveu sua primeira questão!',
        icon: '🎯'
      }));
    }
    
    // Conquista: Streak de 7 dias
    if (profile.currentStreak === 7) {
      newAchievements.push(await this.unlockAchievement(userId, {
        type: 'streak',
        title: 'Semana Completa',
        description: '7 dias consecutivos de estudo!',
        icon: '🔥'
      }));
    }
    
    // Conquista: 100 questões
    if (profile.totalQuestionsAnswered === 100) {
      newAchievements.push(await this.unlockAchievement(userId, {
        type: 'questions_solved',
        title: 'Centenário',
        description: '100 questões resolvidas!',
        icon: '💯'
      }));
    }
    
    return newAchievements;
  }
  
  private static async unlockAchievement(
    userId: string,
    achievement: Partial<Achievement>
  ): Promise<Achievement> {
    const { data } = await supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        progress: 100,
        is_completed: true,
        unlocked_at: new Date().toISOString()
      }, { onConflict: 'user_id,type,title' })
      .select()
      .single();
    
    return this.mapAchievementFromDB(data);
  }
  
  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================
  
  private static async incrementProfileStats(
    userId: string,
    stats: { totalStudyTime?: number; totalQuestionsAnswered?: number }
  ): Promise<void> {
    const profile = await this.getStudentProfile(userId);
    if (!profile) return;
    
    await this.upsertStudentProfile({
      userId,
      totalStudyTime: profile.totalStudyTime + (stats.totalStudyTime || 0),
      totalQuestionsAnswered: profile.totalQuestionsAnswered + (stats.totalQuestionsAnswered || 0)
    });
  }
  
  private static calculateDisciplineScores(progress: TopicProgress[]): { [key: string]: number } {
    const scores: { [key: string]: number } = {};
    const disciplineMap: { [key: string]: { sum: number; count: number } } = {};

    progress.forEach(p => {
        // Assumindo que temos discipline_id no topic (via join) ou precisamos buscar
        const discTitle = p.topic?.discipline?.title || 'Geral'; 
        
        if (!disciplineMap[discTitle]) disciplineMap[discTitle] = { sum: 0, count: 0 };
        disciplineMap[discTitle].sum += p.score;
        disciplineMap[discTitle].count += 1;
    });

    Object.keys(disciplineMap).forEach(key => {
        scores[key] = Math.round(disciplineMap[key].sum / disciplineMap[key].count);
    });

    return scores;
  }
  
  private static calculateTrend(history: PerformanceRecord[]): 'improving' | 'stable' | 'declining' {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(0, 7);
    const older = history.slice(7, 14);
    
    const recentAvg = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, h) => sum + h.score, 0) / older.length : recentAvg;
    
    if (recentAvg > olderAvg + 5) return 'improving';
    if (recentAvg < olderAvg - 5) return 'declining';
    return 'stable';
  }
  
  private static calculateImprovementRate(history: PerformanceRecord[]): number {
    if (history.length < 10) return 0; // Precisa de dados para calcular
    
    // Divide em duas metades
    const mid = Math.floor(history.length / 2);
    const recent = history.slice(0, mid);
    const older = history.slice(mid);

    const recentAvg = recent.reduce((acc, h) => acc + h.score, 0) / recent.length;
    const olderAvg = older.reduce((acc, h) => acc + h.score, 0) / older.length;

    if (olderAvg === 0) return 100; // Melhoria infinita se começou do zero

    return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
  }
  
  private static calculateReadinessScore(
    progress: TopicProgress[]
  ): number {
    const masteredCount = progress.filter(p => p.status === 'mastered').length;
    const totalCount = progress.length || 1;
    return Math.round((masteredCount / totalCount) * 100);
  }
  
  private static estimateAdmissionChance(
    overallAccuracy: number,
    progress: TopicProgress[]
  ): number {
    const readiness = this.calculateReadinessScore(progress);
    const accuracy = overallAccuracy;
    return Math.round((readiness * 0.6) + (accuracy * 0.4));
  }
  
  private static estimateDaysUntilReady(
    progress: TopicProgress[]
  ): number {
    const readiness = this.calculateReadinessScore(progress);
    if (readiness >= 80) return 0;
    
    const gap = 80 - readiness;
    const avgDailyProgress = 2; // Estimativa
    return Math.ceil(gap / avgDailyProgress);
  }
  
  private static identifyStrengths(progress: TopicProgress[]): any[] {
    return progress
      .filter(p => p.score >= 80)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(p => ({
        topicId: p.topicId,
        topicName: p.topic?.topic_name || 'Tópico de Estudo',
        score: p.score
      }));
  }
  
  private static identifyWeaknesses(progress: TopicProgress[]): any[] {
    return progress
      .filter(p => p.score < 60)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(p => ({
        topicId: p.topicId,
        topicName: p.topic?.topic_name || 'Tópico de Estudo',
        score: p.score,
        recommendedAction: 'Revisar teoria e praticar mais questões'
      }));
  }
  
  private static generateInsights(
    profile: StudentAcademicProfile,
    progress: TopicProgress[]
  ): string[] {
    const insights: string[] = [];
    
    if (profile.currentStreak > 7) {
      insights.push(`Excelente! Você está em uma sequência de ${profile.currentStreak} dias.`);
    }
    
    if (profile.overallAccuracy > 80) {
      insights.push('Seu desempenho está acima da média. Continue assim!');
    }

    const mastered = progress.filter(p => p.status === 'mastered').length;
    if (mastered > 0) {
      insights.push(`Você já dominou ${mastered} tópicos importantes!`);
    }
    
    return insights;
  }
  

  
  private static async getPerformanceCache(userId: string): Promise<PerformanceAnalysis | null> {
    const { data } = await supabase
      .from('performance_analysis_cache')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return data ? this.mapPerformanceAnalysisFromDB(data) : null;
  }
  
  private static async savePerformanceCache(
    userId: string,
    analysis: PerformanceAnalysis
  ): Promise<void> {
    await supabase
      .from('performance_analysis_cache')
      .upsert({
        user_id: userId,
        overall_score: analysis.overallScore,
        discipline_scores: analysis.disciplineScores,
        trend: analysis.trend,
        improvement_rate: analysis.improvementRate,
        readiness_score: analysis.readinessScore,
        estimated_admission_chance: analysis.estimatedAdmissionChance,
        days_until_ready: analysis.daysUntilReady,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        common_mistakes: analysis.commonMistakes,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        analyzed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString()
      }, { onConflict: 'user_id' });
  }
  
  // Mappers DB <-> Types
  private static mapProfileFromDB(data: any): StudentAcademicProfile {
    return {
      userId: data.user_id,
      targetUniversity: data.target_university,
      targetCourse: data.target_course,
      targetYear: data.target_year,
      admissionExamDate: data.admission_exam_date ? new Date(data.admission_exam_date) : undefined,
      currentLevel: data.current_level || {},
      completedSections: data.completed_sections || [],
      completedSessions: data.completed_sessions || [],
      masteredTopics: data.mastered_topics || [],
      weakTopics: data.weak_topics || [],
      performanceHistory: [],
      totalStudyTime: data.total_study_time || 0,
      totalQuestionsAnswered: data.total_questions_answered || 0,
      overallAccuracy: data.overall_accuracy || 0,
      currentStreak: data.current_streak || 0,
      longestStreak: data.longest_streak || 0,
      lastUpdated: new Date(data.last_updated)
    };
  }
  
  private static mapProfileToDB(profile: Partial<StudentAcademicProfile>): any {
    return {
      user_id: profile.userId,
      target_university: profile.targetUniversity,
      target_course: profile.targetCourse,
      target_year: profile.targetYear,
      admission_exam_date: profile.admissionExamDate?.toISOString().split('T')[0],
      current_level: profile.currentLevel,
      completed_sections: profile.completedSections,
      completed_sessions: profile.completedSessions,
      mastered_topics: profile.masteredTopics,
      weak_topics: profile.weakTopics,
      total_study_time: profile.totalStudyTime,
      total_questions_answered: profile.totalQuestionsAnswered,
      overall_accuracy: profile.overallAccuracy,
      current_streak: profile.currentStreak,
      longest_streak: profile.longestStreak,
      last_updated: new Date().toISOString()
    };
  }
  
  private static mapTopicProgressFromDB(data: any): TopicProgress {
    return {
      topicId: data.topic_id,
      userId: data.user_id,
      status: data.status,
      score: data.score,
      questionsAnswered: data.questions_answered,
      correctAnswers: data.correct_answers,
      timeSpent: data.time_spent,
      topic: data.topic, // Cast removido pois interface foi atualizada
      lastStudied: data.last_studied ? new Date(data.last_studied) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined
    };
  }
  
  private static mapPerformanceRecordFromDB(data: any): PerformanceRecord {
    return {
      id: data.id,
      userId: data.user_id,
      date: new Date(data.session_date),
      disciplineId: data.discipline_id,
      disciplineName: data.discipline?.title || '',
      score: data.score,
      questionsAnswered: data.questions_answered,
      correctAnswers: data.correct_answers,
      timeSpent: data.time_spent,
      topicsStudied: data.topics_studied || []
    };
  }
  
  private static mapRecommendationFromDB(data: any): ContentRecommendation {
    return {
      id: data.id,
      type: data.type,
      priority: data.priority,
      content: {
        id: data.content_id,
        title: data.content_title,
        discipline: '',
        topicId: data.topic_id,
        estimatedTime: data.estimated_time,
        difficulty: data.difficulty
      },
      reason: data.reason,
      expectedImpact: data.expected_impact,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined
    };
  }
  
  private static mapDailyGoalFromDB(data: any): DailyGoal {
    return {
      date: new Date(data.goal_date),
      questionsToSolve: data.questions_to_solve,
      minutesToStudy: data.minutes_to_study,
      topicsToReview: data.topics_to_review || [],
      isCompleted: data.is_completed,
      completionRate: data.completion_rate
    };
  }
  
  private static mapAchievementFromDB(data: any): Achievement {
    return {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      icon: data.icon,
      unlockedAt: new Date(data.unlocked_at),
      progress: data.progress,
      isCompleted: data.is_completed
    };
  }
  
  private static mapPerformanceAnalysisFromDB(data: any): PerformanceAnalysis {
    return {
      userId: data.user_id,
      analyzedAt: new Date(data.analyzed_at),
      overallScore: data.overall_score,
      disciplineScores: data.discipline_scores || {},
      trend: data.trend,
      improvementRate: data.improvement_rate,
      readinessScore: data.readiness_score,
      estimatedAdmissionChance: data.estimated_admission_chance,
      daysUntilReady: data.days_until_ready,
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      commonMistakes: data.common_mistakes || [],
      insights: data.insights || [],
      recommendations: data.recommendations || []
    };
  }
}
