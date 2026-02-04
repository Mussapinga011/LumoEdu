# 📊 DADOS ACESSÍVEIS PELO PROFESSOR IA

## 🎯 Resumo Executivo

O Professor IA tem acesso a **6 categorias principais de dados** através do `AcademicTrackingService`, totalizando **50+ pontos de dados** sobre cada estudante.

---

## 1️⃣ PERFIL ACADÊMICO (`StudentAcademicProfile`)

### Dados Disponíveis:
```typescript
{
  userId: string,
  targetUniversity: string,
  targetCourse: string,
  examDate: Date,
  
  // Métricas Gerais
  overallAccuracy: number,        // 0-100 (precisão geral)
  totalQuestionsAnswered: number,
  totalCorrectAnswers: number,
  totalStudyTime: number,         // minutos
  
  // Gamificação
  currentStreak: number,          // dias consecutivos
  longestStreak: number,
  totalPoints: number,
  level: number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  lastActivityAt: Date
}
```

### Usado em:
- ✅ Cálculo de eficiência de aprendizado
- ✅ Predição de score futuro
- ✅ Simulação de cenários
- ✅ Otimização de cronograma

---

## 2️⃣ PROGRESSO POR TÓPICO (`TopicProgress[]`)

### Dados Disponíveis:
```typescript
{
  topicId: string,
  userId: string,
  
  // Performance
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered',
  score: number,                  // 0-100
  questionsAnswered: number,
  correctAnswers: number,
  timeSpent: number,              // minutos
  
  // Timestamps
  lastStudied: Date,
  completedAt: Date,
  
  // Relação
  topic: {
    id: string,
    topic_name: string,
    discipline_id: string,
    importance: number,           // 1-5
    estimated_hours: number
  }
}
```

### Usado em:
- ✅ Detecção de gargalo
- ✅ SRS (Spaced Repetition)
- ✅ Cálculo de cobertura
- ✅ Identificação de lacunas
- ✅ Análise de padrões temporais

---

## 3️⃣ HISTÓRICO DE PERFORMANCE (`PerformanceRecord[]`)

### Dados Disponíveis:
```typescript
{
  id: string,
  userId: string,
  date: Date,                     // Data da sessão
  
  // Performance da Sessão
  disciplineId: string,
  disciplineName: string,
  score: number,                  // 0-100
  questionsAnswered: number,
  correctAnswers: number,
  timeSpent: number,              // minutos
  
  // Contexto
  sessionType: 'practice' | 'exam' | 'review',
  difficulty: number,             // 1-5
  
  // Timestamps
  createdAt: Date
}
```

### Usado em:
- ✅ **Regressão Linear** (predição)
- ✅ **Detecção de Platô** (variação diária)
- ✅ **Análise de Padrões** (horário/dia da semana)
- ✅ **Cálculo de Fadiga** (duração vs performance)

---

## 4️⃣ LACUNAS DE CONHECIMENTO (`KnowledgeGap[]`)

### Dados Disponíveis:
```typescript
{
  topicId: string,
  topicName: string,
  disciplineId: string,
  
  // Severidade
  priority: 'low' | 'medium' | 'high' | 'urgent',
  severity: number,               // 0-100 (quanto está prejudicando)
  estimatedTimeToFix: number,     // horas
  
  // Recomendações
  recommendedContent: string[]
}
```

### Usado em:
- ✅ **Algoritmo Guloso** (ROI)
- ✅ **Detecção de Gargalo**
- ✅ **Recomendações Multi-Algoritmo**
- ✅ **Otimização de Cronograma**

---

## 5️⃣ META DIÁRIA (`DailyGoal`)

### Dados Disponíveis:
```typescript
{
  userId: string,
  date: Date,
  
  // Metas
  targetQuestions: number,
  targetMinutes: number,
  targetTopics: number,
  
  // Progresso
  completedQuestions: number,
  completedMinutes: number,
  completedTopics: number,
  
  // Status
  isCompleted: boolean,
  completedAt: Date
}
```

### Usado em:
- ✅ Análise de consistência
- ✅ Cálculo de streak
- ✅ Recomendações de ritmo

---

## 6️⃣ ANÁLISE DE PERFORMANCE (`PerformanceAnalysis`)

### Dados Calculados:
```typescript
{
  // Tendências
  overallTrend: 'improving' | 'stable' | 'declining',
  recentAccuracy: number,
  accuracyChange: number,         // % de mudança
  
  // Por Disciplina
  disciplineBreakdown: {
    disciplineId: string,
    disciplineName: string,
    accuracy: number,
    questionsAnswered: number,
    timeSpent: number,
    trend: 'improving' | 'stable' | 'declining'
  }[],
  
  // Pontos Fortes/Fracos
  strongestDisciplines: string[],
  weakestDisciplines: string[],
  
  // Tempo
  totalStudyTime: number,
  avgSessionLength: number,
  studyFrequency: number,         // sessões por semana
  
  // Período
  periodStart: Date,
  periodEnd: Date
}
```

### Usado em:
- ✅ Dashboard do estudante
- ✅ Identificação de padrões
- ✅ Recomendações personalizadas

---

## 🧮 DADOS DERIVADOS (Calculados pela IA)

### Calculados em Tempo Real:

1. **Eficiência de Aprendizado**
   ```typescript
   efficiency = (accuracy × 0.5) + (consistency × 0.3) + (coverage × 0.2)
   ```

2. **ROI por Tópico**
   ```typescript
   ROI = (severity × priorityMultiplier) / timeNeeded
   ```

3. **Intervalo SRS**
   ```typescript
   interval = score >= 90 ? 30 : score >= 80 ? 14 : score >= 70 ? 7 : 5
   ```

4. **Ponto de Fadiga**
   ```typescript
   fatiguePoint = longAvg < mediumAvg - 5 ? 60 : 45
   ```

5. **Chance de Admissão**
   ```typescript
   sigmoid = 1 / (1 + exp(-(score - 50) / 20))
   ```

---

## 📈 MÉTRICAS TEMPORAIS EXTRAÍDAS

### Do Histórico de Performance:

1. **Horário do Dia**
   - Manhã (6h-12h): Score médio
   - Tarde (12h-18h): Score médio
   - Noite (18h-6h): Score médio

2. **Dia da Semana**
   - Domingo a Sábado: Score médio por dia

3. **Duração de Sessão**
   - Curta (<60min): Score médio
   - Média (60-90min): Score médio
   - Longa (>90min): Score médio

4. **Variação Diária**
   - Usado para detectar platô
   - Threshold: < 3% por 7+ dias

---

## 🎯 RESUMO: O QUE A IA SABE SOBRE O ESTUDANTE

### ✅ Performance Histórica
- Todos os scores de todas as sessões
- Quando estudou (data/hora)
- Quanto tempo estudou
- Quais tópicos estudou

### ✅ Padrões de Comportamento
- Melhor horário do dia
- Melhor dia da semana
- Duração ideal de sessão
- Ponto de fadiga
- Consistência (streak)

### ✅ Lacunas e Gargalos
- Tópicos fracos (severity)
- Tópicos críticos (pré-requisitos)
- Tempo estimado para corrigir
- Prioridade de cada lacuna

### ✅ Contexto Acadêmico
- Universidade alvo
- Curso alvo
- Data do exame
- Disciplinas estudadas
- Importância de cada tópico

### ✅ Progresso e Metas
- Meta diária (questões/minutos/tópicos)
- Progresso em cada tópico
- Status de conclusão
- Última vez que estudou cada tópico

---

## 🚀 COMO OS DADOS SÃO USADOS

### Fase 1: Predição
```
Histórico (60 dias) → Regressão Linear → Score Futuro
Lacunas → Detecção de Gargalo → Alerta
Histórico (14 dias) → Variação < 3% → Platô
```

### Fase 2: Padrões
```
Histórico → Agrupar por Horário → Melhor Período
Histórico → Agrupar por Dia → Melhor Dia
Histórico → Agrupar por Duração → Duração Ideal
Performance Longa vs Média → Ponto de Fadiga
```

### Fase 3: Cronograma
```
Lacunas → Calcular ROI → Ordenar
ROI Ordenado → Alocar por Dia → Cronograma
Cronograma → Calcular Ganho → Score Esperado
```

### Fase 4: Recomendações
```
6 Algoritmos Paralelos → 7+ Recomendações
Ordenar por Prioridade + Impacto + Confiança
Top 7 → Exibir ao Estudante
```

---

## 📊 ESTATÍSTICAS

- **Tabelas Acessadas:** 6
- **Pontos de Dados Brutos:** 50+
- **Métricas Derivadas:** 20+
- **Algoritmos Aplicados:** 6
- **Recomendações Geradas:** 7 (top)
- **Período Analisado:** Até 90 dias

---

## 🔒 PRIVACIDADE

Todos os dados são:
- ✅ Específicos do usuário (filtrados por `userId`)
- ✅ Armazenados no Supabase (seguro)
- ✅ Processados no cliente (sem envio externo)
- ✅ Usados apenas para insights do próprio estudante
