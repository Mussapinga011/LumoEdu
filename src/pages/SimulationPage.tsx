import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { SimulationQuestion, SimulationConfig } from '../types/simulation';
import { saveSimulationResult } from '../services/simulationService.supabase';
import { Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import RichTextRenderer from '../components/RichTextRenderer';
import clsx from 'clsx';
import { addUserActivity, updateUserScore } from '../services/dbService.supabase';

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
        userId: user.id,
        config,
        questions,
        answers,
        score,
        correctCount,
        totalQuestions: questions.length,
        timeSpent
      });

      sessionStorage.setItem('simulationResult', JSON.stringify({
        score,
        correctCount,
        totalQuestions: questions.length,
        timeSpent
      }));

      await Promise.all([
         updateUserScore(user.id),
         addUserActivity(user.id, {
            type: 'exam',
            title: `Simulado: ${getModeName(config.mode || 'random')}`,
            score: score
         })
      ]);

      navigate('/simulation/result');

    } catch (error) {
      console.error('Error saving simulation:', error);
    }
  };

  if (!config || questions.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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

      <div className="w-full bg-gray-200 h-1">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-lg md:text-xl font-medium text-gray-800 mb-6 font-serif leading-relaxed">
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
                      ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                      : "border-gray-100 hover:border-gray-200 text-gray-700"
                  )}
                >
                  <div className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center border-2 text-sm font-black",
                    answers[currentQuestion.id] === option
                      ? "border-primary bg-primary text-white"
                      : "border-gray-100 bg-gray-50 text-gray-400"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="flex-1 text-base">
                    <RichTextRenderer content={option} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t p-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 font-bold"
        >
          <ChevronLeft size={20} />
          Anterior
        </button>

        <div className="text-sm text-gray-400 font-bold uppercase tracking-wider hidden md:block">
          {Object.keys(answers).length} / {questions.length} Respondidas
        </div>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleFinish}
            className="px-8 py-2 bg-green-500 text-white rounded-xl font-black text-lg shadow-[0_4px_0_0_#1a4b2e] active:shadow-none active:translate-y-1 transition-all"
          >
            FINALIZAR
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white font-black text-lg shadow-[0_4px_0_0_#1a4b2e] active:shadow-none active:translate-y-1 transition-all"
          >
            PRÓXIMA
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

const getModeName = (mode: string) => {
  const modes: Record<string, string> = {
    weaknesses: 'Foco em Fraquezas',
    revision: 'Modo Revisão',
    difficult: 'Questões Difíceis',
    random: 'Aleatório',
    custom: 'Personalizado'
  };
  return modes[mode] || 'Simulado';
};

export default SimulationPage;
