# 📝 Sistema de Simulados Personalizados - Implementação Completa

## ✅ Arquivos Já Criados

1. ✅ `src/types/simulation.ts` - Tipos TypeScript
2. ✅ `src/services/simulationService.ts` - Lógica de negócio
3. ✅ `src/pages/SimulationConfigPage.tsx` - Configuração do simulado

---

## 📋 Arquivos Restantes para Criar

### 1. Página de Execução do Simulado

**Arquivo**: `src/pages/SimulationPage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { SimulationQuestion, SimulationConfig } from '../types/simulation';
import { saveSimulationResult } from '../services/simulationService';
import { Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import RichTextRenderer from '../components/RichTextRenderer';
import { Timestamp } from 'firebase/firestore';
import clsx from 'clsx';

const SimulationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [config, setConfig] = useState<SimulationConfig | null>(null);
  const [questions, setQuestions] = useState<SimulationQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Carregar do sessionStorage
    const savedConfig = sessionStorage.getItem('simulationConfig');
    const savedQuestions = sessionStorage.getItem('simulationQuestions');

    if (!savedConfig || !savedQuestions) {
      navigate('/simulation/config');
      return;
    }

    const parsedConfig = JSON.parse(savedConfig);
    const parsedQuestions = JSON.parse(savedQuestions);

    setConfig(parsedConfig);
    setQuestions(parsedQuestions);
    
    // Calcular tempo (2 minutos por questão)
    setTimeLeft(parsedQuestions.length * 120);
  }, [navigate]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isFinished) {
      handleFinish();
    }
  }, [timeLeft, isFinished]);

  const handleAnswer = (option: string) => {
    const currentQuestion = questions[currentIndex];
    setAnswers({ ...answers, [currentQuestion.id]: option });
  };

  const handleFinish = async () => {
    if (!user || !config) return;

    setIsFinished(true);

    const correctCount = questions.filter(
      q => answers[q.id] === q.correctOption
    ).length;

    const score = Math.round((correctCount / questions.length) * 20);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await saveSimulationResult({
        userId: user.uid,
        config,
        questions,
        answers,
        score,
        correctCount,
        totalQuestions: questions.length,
        timeSpent,
        completedAt: Timestamp.now()
      });

      // Salvar resultado no sessionStorage para tela de resultado
      sessionStorage.setItem('simulationResult', JSON.stringify({
        score,
        correctCount,
        totalQuestions: questions.length,
        timeSpent
      }));

      navigate('/simulation/result');
    } catch (error) {
      console.error('Error saving simulation:', error);
    }
  };

  if (!config || questions.length === 0) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-bold text-gray-800">Simulado Personalizado</h1>
          <p className="text-xs text-gray-500">
            Questão {currentIndex + 1} de {questions.length}
          </p>
        </div>
        <div className={clsx(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold",
          timeLeft < 300 ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600"
        )}>
          <Timer size={18} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-1">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-lg md:text-xl font-medium text-gray-800 mb-6">
              <RichTextRenderer content={currentQuestion.statement} />
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  className={clsx(
                    "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3",
                    answers[currentQuestion.id] === option
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-gray-100 hover:border-gray-300 text-gray-700"
                  )}
                >
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold",
                    answers[currentQuestion.id] === option
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 text-gray-400"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="flex-1">
                    <RichTextRenderer content={option} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t p-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft size={20} />
          Anterior
        </button>

        <div className="text-sm text-gray-500">
          {Object.keys(answers).length} de {questions.length} respondidas
        </div>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleFinish}
            className="px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
          >
            Finalizar
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover"
          >
            Próxima
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SimulationPage;
```

---

### 2. Página de Resultado

**Arquivo**: `src/pages/SimulationResultPage.tsx`

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Clock, CheckCircle } from 'lucide-react';

const SimulationResultPage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const savedResult = sessionStorage.getItem('simulationResult');
    if (!savedResult) {
      navigate('/simulation/config');
      return;
    }
    setResult(JSON.parse(savedResult));
  }, [navigate]);

  if (!result) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  const percentage = Math.round((result.correctCount / result.totalQuestions) * 100);
  const minutes = Math.floor(result.timeSpent / 60);
  const seconds = result.timeSpent % 60;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-gray-100">
          <div className="text-6xl mb-4">
            {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚'}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Simulado Concluído!</h1>
          <p className="text-gray-500">
            {percentage >= 80 ? 'Excelente desempenho!' : 
             percentage >= 60 ? 'Bom trabalho!' : 
             'Continue estudando!'}
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Resumo do Desempenho</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Trophy className="mx-auto mb-2 text-blue-600" size={32} />
              <div className="text-3xl font-bold text-blue-600">{result.score}/20</div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Nota</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
              <div className="text-3xl font-bold text-green-600">{result.correctCount}</div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Acertos</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Target className="mx-auto mb-2 text-purple-600" size={32} />
              <div className="text-3xl font-bold text-purple-600">{percentage}%</div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Precisão</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <Clock className="mx-auto mb-2 text-orange-600" size={32} />
              <div className="text-3xl font-bold text-orange-600">{minutes}:{seconds.toString().padStart(2, '0')}</div>
              <div className="text-xs text-gray-500 font-bold uppercase mt-1">Tempo</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progresso</span>
              <span>{result.correctCount}/{result.totalQuestions} questões corretas</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/simulation/config')}
              className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
            >
              🔄 Novo Simulado
            </button>
            <button 
              onClick={() => navigate('/simulation/history')}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              📊 Ver Histórico
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              👤 Ir para Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationResultPage;
```

---

### 3. Adicionar Rotas no App.tsx

```tsx
// Adicionar imports
import SimulationConfigPage from './pages/SimulationConfigPage';
import SimulationPage from './pages/SimulationPage';
import SimulationResultPage from './pages/SimulationResultPage';

// Adicionar rotas dentro do <Route element={<Layout />}>
<Route path="/simulation/config" element={
  <ProtectedRoute>
    <SimulationConfigPage />
  </ProtectedRoute>
} />
<Route path="/simulation/start" element={
  <ProtectedRoute>
    <SimulationPage />
  </ProtectedRoute>
} />
<Route path="/simulation/result" element={
  <ProtectedRoute>
    <SimulationResultPage />
  </ProtectedRoute>
} />
```

---

### 4. Adicionar Link no Menu

**Arquivo**: `src/components/Layout.tsx` ou `MobileNav.tsx`

Adicionar item de menu:

```tsx
{ 
  name: 'Simulados', 
  path: '/simulation/config', 
  icon: Target // ou outro ícone
}
```

---

## 🎯 Como Usar

1. **Acessar**: Menu → "Simulados"
2. **Escolher modo**: Fraquezas, Revisão, Difíceis, Aleatório ou Personalizado
3. **Selecionar**: Quantidade de questões (10, 20, 30, 50)
4. **Iniciar**: Clicar em "Iniciar Simulado"
5. **Responder**: Navegar entre questões e responder
6. **Finalizar**: Ver resultado detalhado
7. **Histórico**: Acompanhar evolução

---

## ✨ Funcionalidades Implementadas

- ✅ 5 modos diferentes de simulado
- ✅ Geração inteligente de questões
- ✅ Timer automático (2 min/questão)
- ✅ Navegação entre questões
- ✅ Progresso visual
- ✅ Resultado detalhado
- ✅ Histórico de questões
- ✅ Rastreamento de progresso
- ✅ Custo: $0

---

## 📊 Próximos Passos Opcionais

- [ ] Página de histórico de simulados
- [ ] Comparação de performance
- [ ] Gráficos de evolução
- [ ] Exportar resultado em PDF
- [ ] Compartilhar resultado

---

**Sistema completo de Simulados Personalizados pronto para uso!** 🎉
