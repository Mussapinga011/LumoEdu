import { AcademicTrackingService } from './academicTrackingService';
import type {
  FuturePerformancePrediction,
  LearningPlateauDetection,
  StudyScenario,
  ScenarioSimulation,
  LinearRegressionResult,
  StudyPattern,
  OptimizedSchedule,
  DailySchedule,
  StudySession,
  SmartRecommendation
} from '../types/academicAI';
import type { TopicProgress } from '../types/academicTracking';

/**
 * 🧠 Sistema de Inteligência Artificial Acadêmica
 * 
 * Motor de IA que transforma dados de tracking em insights preditivos,
 * otimizações automáticas e recomendações personalizadas.
 */
export class AcademicAI {
  
  // ============================================
  // FASE 1: PREDIÇÃO E DETECÇÃO DE PLATÔ
  // ============================================
  
  /**
   * Prevê o desempenho futuro do estudante usando regressão linear
   * 
   * @param userId - ID do usuário
   * @param daysAhead - Quantos dias à frente prever (padrão: 30)
   * @returns Predição com score estimado, confiança e trajetória
   */
  static async predictFuturePerformance(
    userId: string,
    daysAhead: number = 30
  ): Promise<FuturePerformancePrediction> {
    // 1. Buscar histórico de performance dos últimos 60 dias
    const history = await AcademicTrackingService.getPerformanceHistory(userId, 60);
    
    // Validar dados suficientes
    if (history.length < 5) {
      return {
        predictedScore: 0,
        confidence: 0,
        trajectory: 'steady',
        bottleneck: null,
        daysAnalyzed: history.length,
        dataQuality: 'insufficient'
      };
    }
    
    // 2. Preparar dados para regressão (X = dias desde primeira sessão, Y = score)
    const firstDate = new Date(history[history.length - 1].date);
    const dataPoints = history.map(record => {
      const daysSinceStart = Math.floor(
        (new Date(record.date).getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { x: daysSinceStart, y: record.score };
    });
    
    // 3. Calcular regressão linear
    const regression = this.linearRegression(dataPoints);
    
    // 4. Prever score futuro
    const currentDay = dataPoints[0].x; // Último dia registrado
    const futureDay = currentDay + daysAhead;
    const predictedScore = Math.min(100, Math.max(0, regression.prediction(futureDay)));
    
    // 5. Calcular confiança (baseado em R²)
    const confidence = Math.round(regression.rSquared * 100);
    
    // 6. Detectar trajetória (comparar slope recente vs antiga)
    const recentData = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const olderData = dataPoints.slice(Math.floor(dataPoints.length / 2));
    
    const recentRegression = this.linearRegression(recentData);
    const olderRegression = this.linearRegression(olderData);
    
    let trajectory: 'accelerating' | 'steady' | 'decelerating';
    if (recentRegression.slope > olderRegression.slope * 1.2) {
      trajectory = 'accelerating';
    } else if (recentRegression.slope < olderRegression.slope * 0.8) {
      trajectory = 'decelerating';
    } else {
      trajectory = 'steady';
    }
    
    // 7. Identificar gargalo (tópico fundamental com score baixo)
    const bottleneck = await this.identifyBottleneck(userId);
    
    // 8. Determinar qualidade dos dados
    let dataQuality: 'excellent' | 'good' | 'fair' | 'insufficient';
    if (history.length >= 30 && confidence >= 70) dataQuality = 'excellent';
    else if (history.length >= 20 && confidence >= 60) dataQuality = 'good';
    else if (history.length >= 10) dataQuality = 'fair';
    else dataQuality = 'insufficient';
    
    return {
      predictedScore: Math.round(predictedScore),
      confidence,
      trajectory,
      bottleneck,
      daysAnalyzed: history.length,
      dataQuality
    };
  }
  
  /**
   * Detecta se o estudante está em platô de aprendizado
   * 
   * @param userId - ID do usuário
   * @returns Informações sobre o platô e estratégias para sair dele
   */
  static async detectLearningPlateau(userId: string): Promise<LearningPlateauDetection> {
    // 1. Buscar histórico recente (últimos 14 dias)
    const history = await AcademicTrackingService.getPerformanceHistory(userId, 14);
    
    if (history.length < 7) {
      return {
        isInPlateau: false,
        plateauDuration: 0,
        lastSignificantImprovement: null,
        suggestedAction: 'Continue estudando para acumular mais dados.',
        breakThroughStrategies: [],
        plateauSeverity: 'mild'
      };
    }
    
    // 2. Calcular variação diária de score
    const variations: number[] = [];
    for (let i = 0; i < history.length - 1; i++) {
      const variation = Math.abs(history[i].score - history[i + 1].score);
      variations.push(variation);
    }
    
    // 3. Detectar platô (variação < 3% por 7+ dias consecutivos)
    const PLATEAU_THRESHOLD = 3;
    const PLATEAU_MIN_DAYS = 7;
    
    let plateauDays = 0;
    let lastSignificantImprovement: Date | null = null;
    
    for (let i = 0; i < variations.length; i++) {
      if (variations[i] < PLATEAU_THRESHOLD) {
        plateauDays++;
      } else {
        if (plateauDays === 0) {
          lastSignificantImprovement = new Date(history[i].date);
        }
        break;
      }
    }
    
    const isInPlateau = plateauDays >= PLATEAU_MIN_DAYS;
    
    // 4. Determinar severidade
    let plateauSeverity: 'mild' | 'moderate' | 'severe';
    if (plateauDays >= 14) plateauSeverity = 'severe';
    else if (plateauDays >= 10) plateauSeverity = 'moderate';
    else plateauSeverity = 'mild';
    
    // 5. Gerar estratégias de breakthrough
    const breakThroughStrategies: string[] = [];
    
    if (isInPlateau) {
      breakThroughStrategies.push(
        '🔄 Mude de disciplina temporariamente para refresh mental',
        '🎯 Foque em questões mais difíceis para sair da zona de conforto',
        '📚 Revise a teoria antes de fazer mais questões',
        '🤝 Estude em grupo ou explique conceitos para alguém',
        '⏸️ Tire 1-2 dias de descanso para consolidação'
      );
      
      if (plateauSeverity === 'severe') {
        breakThroughStrategies.unshift(
          '🚨 URGENTE: Você está estagnado há muito tempo. Considere mudar completamente sua abordagem de estudo.'
        );
      }
    }
    
    // 6. Sugestão de ação
    let suggestedAction = '';
    if (isInPlateau) {
      suggestedAction = `Você está em platô há ${plateauDays} dias. Mude sua abordagem!`;
    } else {
      suggestedAction = 'Continue com sua estratégia atual. Você está evoluindo!';
    }
    
    return {
      isInPlateau,
      plateauDuration: plateauDays,
      lastSignificantImprovement,
      suggestedAction,
      breakThroughStrategies,
      plateauSeverity
    };
  }
  
  /**
   * Simula diferentes cenários de estudo
   * 
   * @param userId - ID do usuário
   * @param scenarios - Array de cenários para simular
   * @returns Simulações com scores estimados e recomendações
   */
  static async simulateStudyScenarios(
    userId: string,
    scenarios: StudyScenario[]
  ): Promise<ScenarioSimulation[]> {
    // 1. Buscar perfil e progresso atual
    const profile = await AcademicTrackingService.getStudentProfile(userId);
    const topicProgress = await AcademicTrackingService.getTopicProgress(userId);
    
    if (!profile) {
      return scenarios.map(s => ({
        scenario: `${s.hoursPerDay}h/dia por ${s.days} dias`,
        estimatedScore: 0,
        estimatedAdmissionChance: 0,
        recommendation: 'Dados insuficientes para simulação.',
        feasibility: 'unrealistic'
      }));
    }
    
    const currentScore = profile.overallAccuracy;
    
    // 2. Calcular eficiência de aprendizado do estudante
    const efficiency = this.calculateLearningEfficiency(profile, topicProgress);
    
    // 3. Simular cada cenário
    return scenarios.map(scenario => {
      const totalHours = scenario.hoursPerDay * scenario.days;
      
      // Aplicar retorno decrescente (Lei de Diminishing Returns)
      // Fórmula: ganho = horas × eficiência × 0.5 × (1 - scoreAtual/100)
      const diminishingFactor = 1 - (currentScore / 100);
      const baseGain = totalHours * efficiency * 0.5 * diminishingFactor;
      
      // Aplicar fator de fadiga (estudar 8h/dia não é 4x melhor que 2h/dia)
      let fatiguePenalty = 1;
      if (scenario.hoursPerDay > 4) fatiguePenalty = 0.8;
      if (scenario.hoursPerDay > 6) fatiguePenalty = 0.6;
      if (scenario.hoursPerDay > 8) fatiguePenalty = 0.4;
      
      const adjustedGain = baseGain * fatiguePenalty;
      const estimatedScore = Math.min(100, Math.round(currentScore + adjustedGain));
      
      // Calcular chance de admissão (curva sigmoide)
      const admissionChance = this.calculateAdmissionChance(estimatedScore);
      
      // Gerar recomendação
      let recommendation = '';
      let feasibility: 'optimal' | 'good' | 'challenging' | 'unrealistic';
      
      if (scenario.hoursPerDay > 8) {
        recommendation = '⚠️ Ritmo insustentável. Risco de burnout alto.';
        feasibility = 'unrealistic';
      } else if (scenario.hoursPerDay >= 4 && scenario.hoursPerDay <= 6) {
        recommendation = '✅ Excelente! Este ritmo te leva à aprovação com equilíbrio.';
        feasibility = 'optimal';
      } else if (scenario.hoursPerDay >= 2 && scenario.hoursPerDay < 4) {
        recommendation = '👍 Bom ritmo. Progresso consistente esperado.';
        feasibility = 'good';
      } else if (scenario.hoursPerDay < 2) {
        recommendation = '⏳ Ritmo lento. Considere aumentar dedicação.';
        feasibility = 'challenging';
      } else {
        recommendation = '⚡ Ritmo intenso. Monitore sinais de fadiga.';
        feasibility = 'challenging';
      }
      
      return {
        scenario: `${scenario.hoursPerDay}h/dia por ${scenario.days} dias`,
        estimatedScore,
        estimatedAdmissionChance: admissionChance,
        recommendation,
        feasibility
      };
    });
  }
  
  // ============================================
  // FASE 2: ANÁLISE DE PADRÕES DE ESTUDO
  // ============================================
  
  /**
   * Analisa padrões de estudo do usuário
   * Identifica melhor horário, dia da semana, duração ideal e ponto de fadiga
   * 
   * @param userId - ID do usuário
   * @returns Padrões detectados com insights acionáveis
   */
  static async analyzeStudyPatterns(userId: string): Promise<StudyPattern> {
    // 1. Buscar histórico completo (últimos 60 dias)
    const history = await AcademicTrackingService.getPerformanceHistory(userId, 60);
    
    if (history.length < 10) {
      return {
        bestTimeOfDay: 'Dados insuficientes',
        bestDayOfWeek: 'Dados insuficientes',
        avgSessionLength: 0,
        optimalSessionLength: 0,
        fatiguePoint: 0,
        insights: ['Continue estudando para acumular mais dados de análise.']
      };
    }
    
    // 2. Analisar melhor horário do dia
    const timeOfDayPerformance = this.analyzeTimeOfDay(history);
    const bestTimeOfDay = this.getBestTimeOfDay(timeOfDayPerformance);
    
    // 3. Analisar melhor dia da semana
    const dayOfWeekPerformance = this.analyzeDayOfWeek(history);
    const bestDayOfWeek = this.getBestDayOfWeek(dayOfWeekPerformance);
    
    // 4. Calcular duração média e ideal de sessão
    const sessionLengths = history.map(h => h.timeSpent);
    const avgSessionLength = Math.round(
      sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length
    );
    
    // Agrupar sessões por duração e calcular score médio
    const shortSessions = history.filter(h => h.timeSpent < 60);
    const mediumSessions = history.filter(h => h.timeSpent >= 60 && h.timeSpent <= 90);
    const longSessions = history.filter(h => h.timeSpent > 90);
    
    const shortAvg = shortSessions.length > 0
      ? shortSessions.reduce((sum, s) => sum + s.score, 0) / shortSessions.length
      : 0;
    const mediumAvg = mediumSessions.length > 0
      ? mediumSessions.reduce((sum, s) => sum + s.score, 0) / mediumSessions.length
      : 0;
    const longAvg = longSessions.length > 0
      ? longSessions.reduce((sum, s) => sum + s.score, 0) / longSessions.length
      : 0;
    
    // Determinar duração ideal (qual teve melhor score)
    let optimalSessionLength = 60; // Padrão
    let bestScore = mediumAvg;
    
    if (shortAvg > bestScore) {
      optimalSessionLength = 45;
      bestScore = shortAvg;
    }
    if (longAvg > bestScore) {
      optimalSessionLength = 90;
    }
    
    // 5. Detectar ponto de fadiga
    // Se sessões longas têm score menor que médias, há fadiga precoce
    let fatiguePoint = 90; // Padrão
    if (longAvg < mediumAvg - 5) {
      fatiguePoint = 60; // Fadiga após 1h
    } else if (longAvg < mediumAvg - 10) {
      fatiguePoint = 45; // Fadiga após 45min
    }
    
    // 6. Gerar insights personalizados
    const insights: string[] = [];
    
    // Insight sobre horário
    const timeComparison = this.compareTimeOfDay(timeOfDayPerformance, bestTimeOfDay);
    if (timeComparison.difference > 10) {
      insights.push(
        `📊 Você rende ${timeComparison.difference}% melhor ${timeComparison.bestPeriod.toLowerCase()}`
      );
    }
    
    // Insight sobre fadiga
    if (fatiguePoint < 60) {
      insights.push(
        `⚠️ Você perde foco após ${fatiguePoint}min. Faça pausas de 10min.`
      );
    } else if (fatiguePoint === 60) {
      insights.push(
        `⚠️ Você perde foco após 1h. Faça pausas de 10min.`
      );
    }
    
    // Insight sobre duração ideal
    if (optimalSessionLength !== avgSessionLength) {
      insights.push(
        `🎯 Sessões de ${optimalSessionLength}min funcionam melhor para você`
      );
    }
    
    // Insight sobre dia da semana
    const dayComparison = this.compareDayOfWeek(dayOfWeekPerformance);
    if (dayComparison.difference > 8) {
      insights.push(
        `📅 ${bestDayOfWeek} é seu melhor dia (${dayComparison.difference}% acima da média)`
      );
    }
    
    // Insight sobre consistência
    if (avgSessionLength < 30) {
      insights.push(
        `⏱️ Suas sessões são curtas (${avgSessionLength}min). Tente aumentar para 45-60min.`
      );
    }
    
    return {
      bestTimeOfDay,
      bestDayOfWeek,
      avgSessionLength,
      optimalSessionLength,
      fatiguePoint,
      insights
    };
  }
  
  // ============================================
  // FASE 3: OTIMIZAÇÃO DE CRONOGRAMA
  // ============================================
  
  /**
   * Otimiza automaticamente o cronograma de estudos
   * Usa algoritmo guloso baseado em ROI para maximizar ganho de aprendizado
   * 
   * @param userId - ID do usuário
   * @param availableHoursPerDay - Horas disponíveis por dia
   * @param targetDate - Data do exame
   * @returns Cronograma otimizado dia-a-dia
   */
  static async optimizeSchedule(
    userId: string,
    availableHoursPerDay: number,
    targetDate: Date
  ): Promise<OptimizedSchedule> {
    // 1. Buscar lacunas de conhecimento (tópicos fracos)
    const gaps = await AcademicTrackingService.identifyKnowledgeGaps(userId);
    const profile = await AcademicTrackingService.getStudentProfile(userId);
    
    if (!profile || gaps.length === 0) {
      return {
        schedule: [],
        expectedFinalScore: profile?.overallAccuracy || 0,
        weaknessesAddressed: 0,
        totalStudyHours: 0
      };
    }
    
    // 2. Calcular ROI de cada tópico
    const topicsWithROI = gaps.map(gap => {
      // Potencial de ganho = severidade × multiplicador de prioridade
      const priorityMultiplier = 
        gap.priority === 'urgent' ? 2.0 :
        gap.priority === 'high' ? 1.5 :
        gap.priority === 'medium' ? 1.0 : 0.5;
      
      const potentialGain = gap.severity * priorityMultiplier;
      
      // Tempo necessário (estimativa baseada em severidade)
      const timeNeeded = gap.severity / 10; // Severidade 80 = 8 horas
      
      // ROI = Ganho Potencial / Tempo Necessário
      const roi = potentialGain / timeNeeded;
      
      return {
        ...gap,
        potentialGain,
        timeNeeded,
        roi
      };
    });
    
    // 3. Ordenar tópicos por ROI decrescente (Algoritmo Guloso)
    const sortedTopics = topicsWithROI.sort((a, b) => b.roi - a.roi);
    
    // 4. Calcular dias disponíveis até o exame
    const today = new Date();
    const daysUntilExam = Math.ceil(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilExam <= 0) {
      return {
        schedule: [],
        expectedFinalScore: profile.overallAccuracy,
        weaknessesAddressed: 0,
        totalStudyHours: 0
      };
    }
    
    // 5. Gerar cronograma dia-a-dia
    const schedule: DailySchedule[] = [];
    let totalStudyHours = 0;
    let weaknessesAddressed = 0;
    let topicIndex = 0;
    let remainingTimeForCurrentTopic = sortedTopics[0]?.timeNeeded || 0;
    
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    for (let day = 0; day < Math.min(daysUntilExam, 30); day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      
      const dayOfWeek = daysOfWeek[currentDate.getDay()];
      const dateStr = `${dayOfWeek}, ${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const sessions: StudySession[] = [];
      let hoursAllocatedToday = 0;
      
      // Alocar sessões para este dia
      while (hoursAllocatedToday < availableHoursPerDay && topicIndex < sortedTopics.length) {
        const currentTopic = sortedTopics[topicIndex];
        
        // Determinar duração da sessão (máximo 2h por sessão)
        const sessionDuration = Math.min(
          2, // Máximo 2h por sessão
          remainingTimeForCurrentTopic,
          availableHoursPerDay - hoursAllocatedToday
        );
        
        if (sessionDuration < 0.5) {
          // Se sobrou menos de 30min, pular para próximo tópico
          topicIndex++;
          if (topicIndex < sortedTopics.length) {
            remainingTimeForCurrentTopic = sortedTopics[topicIndex].timeNeeded;
          }
          continue;
        }
        
        // Determinar horário da sessão
        const sessionTime = sessions.length === 0 ? '08:00' :
                           sessions.length === 1 ? '14:00' :
                           sessions.length === 2 ? '19:00' : '21:00';
        
        // Determinar prioridade visual
        const priority: 'critical' | 'high' | 'medium' | 'low' = 
          currentTopic.severity > 80 ? 'critical' :
          currentTopic.severity > 60 ? 'high' :
          currentTopic.severity > 40 ? 'medium' : 'low';
        
        sessions.push({
          time: sessionTime,
          topicId: currentTopic.topicId,
          topicName: currentTopic.topicName,
          duration: Math.round(sessionDuration * 60), // Converter para minutos
          expectedGain: Math.round(currentTopic.potentialGain / currentTopic.timeNeeded * sessionDuration),
          priority
        });
        
        hoursAllocatedToday += sessionDuration;
        remainingTimeForCurrentTopic -= sessionDuration;
        totalStudyHours += sessionDuration;
        
        // Se terminou este tópico, passar para o próximo
        if (remainingTimeForCurrentTopic <= 0) {
          weaknessesAddressed++;
          topicIndex++;
          if (topicIndex < sortedTopics.length) {
            remainingTimeForCurrentTopic = sortedTopics[topicIndex].timeNeeded;
          }
        }
      }
      
      if (sessions.length > 0) {
        schedule.push({
          day: dateStr,
          date: currentDate,
          sessions
        });
      }
      
      // Se já endereçou todos os tópicos, parar
      if (topicIndex >= sortedTopics.length) break;
    }
    
    // 6. Calcular score final esperado
    const totalPotentialGain = sortedTopics
      .slice(0, weaknessesAddressed)
      .reduce((sum, topic) => sum + topic.potentialGain, 0);
    
    const efficiency = this.calculateLearningEfficiency(
      profile,
      await AcademicTrackingService.getTopicProgress(userId)
    );
    
    const expectedGain = totalPotentialGain * efficiency * 0.3; // Fator de realismo
    const expectedFinalScore = Math.min(100, Math.round(profile.overallAccuracy + expectedGain));
    
    return {
      schedule,
      expectedFinalScore,
      weaknessesAddressed,
      totalStudyHours: Math.round(totalStudyHours)
    };
  }
  
  // ============================================
  // FASE 4: RECOMENDAÇÕES MULTI-ALGORITMO
  // ============================================
  
  /**
   * Gera recomendações inteligentes combinando múltiplos algoritmos
   * Combina: Gargalo, SRS, ROI, Platô, Fadiga e Teoria
   * 
   * @param userId - ID do usuário
   * @returns Array de recomendações ordenadas por prioridade
   */
  static async generateSmartRecommendations(userId: string): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = [];
    
    // Buscar dados necessários
    const [profile, gaps, topicProgress, plateau, patterns] = await Promise.all([
      AcademicTrackingService.getStudentProfile(userId),
      AcademicTrackingService.identifyKnowledgeGaps(userId),
      AcademicTrackingService.getTopicProgress(userId),
      this.detectLearningPlateau(userId),
      this.analyzeStudyPatterns(userId)
    ]);
    
    if (!profile) return [];
    
    // ============================================
    // ALGORITMO 1: DETECÇÃO DE GARGALO
    // ============================================
    const bottleneck = await this.identifyBottleneck(userId);
    if (bottleneck) {
      recommendations.push({
        id: 'bottleneck',
        type: 'urgent',
        title: '🚨 Gargalo Crítico Detectado',
        description: `${bottleneck} está limitando seu progresso`,
        reasoning: 'IA detectou que este tópico é pré-requisito para outros',
        priority: 10,
        estimatedImpact: 25,
        confidence: 85
      });
    }
    
    // ============================================
    // ALGORITMO 2: SRS INTELIGENTE (Spaced Repetition)
    // ============================================
    const now = new Date();
    topicProgress.forEach(topic => {
      if (!topic.lastStudied) return;
      
      const daysSinceStudy = Math.floor(
        (now.getTime() - topic.lastStudied.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Determinar intervalo ideal baseado no score
      const idealInterval = 
        topic.score >= 90 ? 30 :
        topic.score >= 80 ? 14 :
        topic.score >= 70 ? 7 : 5;
      
      // Se passou do intervalo ideal, recomendar revisão
      if (daysSinceStudy >= idealInterval) {
        const urgency = (daysSinceStudy / idealInterval) * 10;
        const topicName = topic.topic?.name || `Tópico ${topic.topicId.slice(0, 8)}`;
        recommendations.push({
          id: `srs-${topic.topicId}`,
          type: 'review',
          title: '🔄 Revisão Espaçada',
          description: `${topicName} precisa de revisão`,
          reasoning: `Último estudo há ${daysSinceStudy} dias`,
          priority: Math.min(10, Math.round(urgency)),
          estimatedImpact: 15,
          confidence: 95
        });
      }
    });
    
    // ============================================
    // ALGORITMO 3: LACUNAS DE ALTO ROI
    // ============================================
    const highROIGaps = gaps
      .filter(gap => gap.priority === 'high' || gap.priority === 'urgent')
      .slice(0, 3);
    
    highROIGaps.forEach(gap => {
      recommendations.push({
        id: `roi-${gap.topicId}`,
        type: 'practice',
        title: '🎯 Lacuna de Alto Retorno',
        description: `${gap.topicName} tem alto potencial de melhoria`,
        reasoning: `Severidade: ${gap.severity}% | Tempo estimado: ${gap.estimatedTimeToFix}h`,
        priority: gap.priority === 'urgent' ? 9 : 8,
        estimatedImpact: Math.round(gap.severity / 5),
        confidence: 80
      });
    });
    
    // ============================================
    // ALGORITMO 4: DETECÇÃO DE PLATÔ
    // ============================================
    if (plateau.isInPlateau && plateau.plateauDuration > 7) {
      recommendations.push({
        id: 'plateau',
        type: 'rest',
        title: '⚠️ Platô Detectado',
        description: plateau.suggestedAction,
        reasoning: `Sem evolução significativa há ${plateau.plateauDuration} dias`,
        priority: 9,
        estimatedImpact: 20,
        confidence: 90
      });
    }
    
    // ============================================
    // ALGORITMO 5: LACUNA CONCEITUAL (TEORIA)
    // ============================================
    const weakTopics = gaps.filter(gap => gap.severity > 60);
    if (weakTopics.length >= 3) {
      recommendations.push({
        id: 'theory',
        type: 'theory',
        title: '📚 Reforço Teórico Necessário',
        description: 'Múltiplos tópicos com dificuldade detectados',
        reasoning: `${weakTopics.length} tópicos com score < 40%`,
        priority: 7,
        estimatedImpact: 30,
        confidence: 75
      });
    }
    
    // ============================================
    // ALGORITMO 6: DESCANSO ESTRATÉGICO
    // ============================================
    if (patterns.fatiguePoint < 60 && patterns.avgSessionLength > 0) {
      recommendations.push({
        id: 'rest',
        type: 'rest',
        title: '⏸️ Pausas Estratégicas',
        description: 'Você perde foco rapidamente',
        reasoning: `Ponto de fadiga: ${patterns.fatiguePoint}min`,
        priority: 6,
        estimatedImpact: 10,
        confidence: 85
      });
    }
    
    // ============================================
    // ORDENAR POR PRIORIDADE E IMPACTO
    // ============================================
    return recommendations
      .sort((a, b) => {
        // Primeiro por prioridade
        if (b.priority !== a.priority) return b.priority - a.priority;
        // Depois por impacto
        if (b.estimatedImpact !== a.estimatedImpact) return b.estimatedImpact - a.estimatedImpact;
        // Por fim por confiança
        return b.confidence - a.confidence;
      })
      .slice(0, 7); // Retornar top 7 recomendações
  }
  
  // ============================================
  // MÉTODOS AUXILIARES (PRIVADOS)
  // ============================================
  
  /**
   * Implementação de Regressão Linear Simples
   * Calcula y = mx + b e R²
   */
  private static linearRegression(
    dataPoints: Array<{ x: number; y: number }>
  ): LinearRegressionResult {
    const n = dataPoints.length;
    
    if (n === 0) {
      return {
        slope: 0,
        intercept: 0,
        rSquared: 0,
        prediction: () => 0
      };
    }
    
    // Calcular somas
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);
    
    // Calcular slope (m) e intercept (b)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calcular R² (coeficiente de determinação)
    const meanY = sumY / n;
    const ssTotal = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const ssResidual = dataPoints.reduce((sum, p) => {
      const predicted = slope * p.x + intercept;
      return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    
    const rSquared = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);
    
    return {
      slope,
      intercept,
      rSquared: Math.max(0, Math.min(1, rSquared)), // Garantir entre 0 e 1
      prediction: (x: number) => slope * x + intercept
    };
  }
  
  /**
   * Identifica o tópico fundamental que está bloqueando o progresso
   */
  private static async identifyBottleneck(userId: string): Promise<string | null> {
    const gaps = await AcademicTrackingService.identifyKnowledgeGaps(userId);
    
    // Procurar por tópicos de alta prioridade com score muito baixo
    const criticalGap = gaps.find(gap => 
      gap.priority === 'high' && gap.severity > 70
    );
    
    return criticalGap ? criticalGap.topicName : null;
  }
  
  /**
   * Calcula a eficiência de aprendizado do estudante
   * Baseado em precisão, consistência e cobertura
   */
  private static calculateLearningEfficiency(
    profile: any,
    topicProgress: TopicProgress[]
  ): number {
    const accuracy = profile.overallAccuracy / 100;
    const consistency = Math.min(profile.currentStreak / 30, 1);
    
    // Calcular cobertura (quantos tópicos já estudou)
    const totalTopics = topicProgress.length || 1;
    const studiedTopics = topicProgress.filter(p => p.questionsAnswered > 0).length;
    const coverage = studiedTopics / totalTopics;
    
    // Fórmula ponderada
    const efficiency = (accuracy * 0.5) + (consistency * 0.3) + (coverage * 0.2);
    
    return efficiency;
  }
  
  /**
   * Calcula chance de admissão usando curva sigmoide
   */
  private static calculateAdmissionChance(score: number): number {
    // Normalizar score (50 = ponto médio)
    const normalized = (score - 50) / 20;
    
    // Aplicar função sigmoide
    const sigmoid = 1 / (1 + Math.exp(-normalized));
    
    return Math.round(sigmoid * 100);
  }
  
  /**
   * Analisa performance por horário do dia
   */
  private static analyzeTimeOfDay(history: any[]): { morning: number; afternoon: number; evening: number } {
    const morning = history.filter(h => {
      const hour = new Date(h.date).getHours();
      return hour >= 6 && hour < 12;
    });
    const afternoon = history.filter(h => {
      const hour = new Date(h.date).getHours();
      return hour >= 12 && hour < 18;
    });
    const evening = history.filter(h => {
      const hour = new Date(h.date).getHours();
      return hour >= 18 || hour < 6;
    });
    
    const morningAvg = morning.length > 0
      ? morning.reduce((sum, s) => sum + s.score, 0) / morning.length
      : 0;
    const afternoonAvg = afternoon.length > 0
      ? afternoon.reduce((sum, s) => sum + s.score, 0) / afternoon.length
      : 0;
    const eveningAvg = evening.length > 0
      ? evening.reduce((sum, s) => sum + s.score, 0) / evening.length
      : 0;
    
    return { morning: morningAvg, afternoon: afternoonAvg, evening: eveningAvg };
  }
  
  /**
   * Identifica o melhor horário do dia
   */
  private static getBestTimeOfDay(performance: { morning: number; afternoon: number; evening: number }): string {
    const max = Math.max(performance.morning, performance.afternoon, performance.evening);
    if (max === 0) return 'Dados insuficientes';
    if (performance.morning === max) return 'Manhã (6h-12h)';
    if (performance.afternoon === max) return 'Tarde (12h-18h)';
    return 'Noite (18h-6h)';
  }
  
  /**
   * Analisa performance por dia da semana
   */
  private static analyzeDayOfWeek(history: any[]): Record<string, number> {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const performance: Record<string, number[]> = {};
    
    history.forEach(h => {
      const dayIndex = new Date(h.date).getDay();
      const dayName = days[dayIndex];
      if (!performance[dayName]) performance[dayName] = [];
      performance[dayName].push(h.score);
    });
    
    const averages: Record<string, number> = {};
    Object.keys(performance).forEach(day => {
      averages[day] = performance[day].reduce((sum, score) => sum + score, 0) / performance[day].length;
    });
    
    return averages;
  }
  
  /**
   * Identifica o melhor dia da semana
   */
  private static getBestDayOfWeek(performance: Record<string, number>): string {
    const entries = Object.entries(performance);
    if (entries.length === 0) return 'Dados insuficientes';
    
    const best = entries.reduce((max, curr) => curr[1] > max[1] ? curr : max);
    return best[0];
  }
  
  /**
   * Compara performance de horários
   */
  private static compareTimeOfDay(
    performance: { morning: number; afternoon: number; evening: number },
    bestPeriod: string
  ): { difference: number; bestPeriod: string } {
    const values = [performance.morning, performance.afternoon, performance.evening];
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.filter(v => v > 0).length;
    
    return {
      difference: Math.round(((max - avg) / avg) * 100),
      bestPeriod
    };
  }
  
  /**
   * Compara performance de dias da semana
   */
  private static compareDayOfWeek(
    performance: Record<string, number>
  ): { difference: number } {
    const values = Object.values(performance);
    if (values.length === 0) return { difference: 0 };
    
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    
    return {
      difference: Math.round(((max - avg) / avg) * 100)
    };
  }
}
