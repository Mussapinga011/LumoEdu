import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExam, getQuestionsByExam, addUserActivity } from '../services/dbService';
import { getOfflineExam, saveOfflineProgress } from '../services/offlineService';
import { Exam, Question } from '../types/exam';
import { useAuthStore } from '../stores/useAuthStore';
import { useOffline } from '../hooks/useOffline';
import { Timer, ChevronLeft, ChevronRight, Flag, WifiOff } from 'lucide-react';
import RichTextRenderer from '../components/RichTextRenderer';
import clsx from 'clsx';

const SimulationPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes in seconds
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const isOnline = useOffline();

  useEffect(() => {
    if (examId) {
      fetchExamData(examId);
    }
  }, [examId]);

  useEffect(() => {
    if (!loading && !isFinished && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isFinished) {
      handleSubmit();
    }
  }, [loading, isFinished, timeLeft]);

  const fetchExamData = async (id: string) => {
    setLoading(true);
    try {
      // Try online first
      if (isOnline) {
        const examData = await getExam(id);
        const questionsData = await getQuestionsByExam(id);
        setExam(examData);
        setQuestions(questionsData);
        setIsOfflineMode(false);
      } else {
        // Fallback to offline
        const offlineData = await getOfflineExam(id);
        if (offlineData) {
          setExam({
            id: offlineData.id,
            disciplineId: offlineData.disciplineId,
            name: offlineData.title,
            year: offlineData.year,
            season: '1ª época',
            questionsCount: offlineData.questions.length,
            createdAt: null,
          });
          setQuestions(offlineData.questions);
          setIsOfflineMode(true);
        } else {
          throw new Error('Exam not available offline');
        }
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      alert('Erro ao carregar exame. Certifique-se de que está online ou que baixou este exame.');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (option: string) => {
    if (isFinished) return;
    const currentQ = questions[currentQuestionIndex];
    setAnswers({ ...answers, [currentQ.id]: option });
  };

  const toggleFlag = () => {
    const currentQ = questions[currentQuestionIndex];
    if (flaggedQuestions.includes(currentQ.id)) {
      setFlaggedQuestions(flaggedQuestions.filter(id => id !== currentQ.id));
    } else {
      setFlaggedQuestions([...flaggedQuestions, currentQ.id]);
    }
  };

  const handleSubmit = async () => {
    if (!user || !exam) return;
    
    setIsFinished(true);
    
    // Calculate score
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctOption) {
        correctCount++;
      }
    });
    
    const finalScore = Math.round((correctCount / questions.length) * 20); // 0-20 scale
    setScore(finalScore);

    // Save activity (only if online)
    if (isOnline && !isOfflineMode) {
      await addUserActivity(user.uid, {
        type: 'exam',
        title: `Simulado: ${exam.name}`,
        timestamp: new Date() as any,
        score: finalScore,
        xpEarned: finalScore * 10
      });
    } else if (isOfflineMode) {
      // Save progress locally for sync later
      await saveOfflineProgress(examId!, user.uid, answers);
    }

    // Update global score (optional, maybe separate simulation score?)
    // await updateUserScore(user.uid); 
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Carregando simulado...</div>;
  }

  if (!exam) {
    return <div className="text-center p-8">Exame não encontrado.</div>;
  }

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-gray-100">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Simulado Concluído!</h1>
          <p className="text-gray-500 mb-8">Aqui está o seu resultado:</p>
          
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{score}/20</div>
              <div className="text-sm text-gray-400 font-bold uppercase">Nota Final</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500">
                {Object.keys(answers).filter(id => answers[id] === questions.find(q => q.id === id)?.correctOption).length}
                <span className="text-xl text-gray-400">/{questions.length}</span>
              </div>
              <div className="text-sm text-gray-400 font-bold uppercase">Acertos</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button 
              onClick={() => navigate('/disciplines')}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Voltar ao Início
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-hover transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sem Questões</h2>
        <p className="text-gray-500 mb-6">Este exame ainda não possui questões cadastradas.</p>
        <button
          onClick={() => navigate('/disciplines')}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="font-bold text-gray-800 truncate max-w-[200px] md:max-w-md">{exam.name}</h1>
          <p className="text-xs text-gray-500">Questão {currentQuestionIndex + 1} de {questions.length}</p>
        </div>
        <div className="flex items-center gap-2">
          {isOfflineMode && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
              <WifiOff size={14} />
              Offline
            </div>
          )}
          <div className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold",
            timeLeft < 300 ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600"
          )}>
            <Timer size={18} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-bold">
                  Questão {currentQuestionIndex + 1}
                </span>
                <button 
                  onClick={toggleFlag}
                  className={clsx(
                    "p-2 rounded-full transition-colors",
                    flaggedQuestions.includes(currentQuestion.id) ? "text-orange-500 bg-orange-50" : "text-gray-400 hover:bg-gray-100"
                  )}
                >
                  <Flag size={20} />
                </button>
              </div>
              
              <div className="text-lg md:text-xl font-medium text-gray-800 mb-8">
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
                      answers[currentQuestion.id] === option ? "border-primary bg-primary text-white" : "border-gray-300 text-gray-400"
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

        {/* Sidebar (Desktop) */}
        <div className="hidden md:flex w-72 bg-gray-50 border-l flex-col p-4">
          <h3 className="font-bold text-gray-700 mb-4">Navegação</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={clsx(
                  "aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-colors relative",
                  currentQuestionIndex === idx ? "ring-2 ring-primary ring-offset-2" : "",
                  answers[q.id] 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-100"
                )}
              >
                {idx + 1}
                {flaggedQuestions.includes(q.id) && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-auto">
            <button
              onClick={() => {
                if (window.confirm("Tem certeza que deseja finalizar o simulado?")) {
                  handleSubmit();
                }
              }}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
            >
              Finalizar Simulado
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex items-center justify-between z-20">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="p-2 rounded-lg text-gray-600 disabled:opacity-30"
        >
          <ChevronLeft size={24} />
        </button>
        
        <button
          onClick={() => {
            if (window.confirm("Tem certeza que deseja finalizar o simulado?")) {
              handleSubmit();
            }
          }}
          className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm"
        >
          Finalizar
        </button>

        <button
          onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
          disabled={currentQuestionIndex === questions.length - 1}
          className="p-2 rounded-lg text-gray-600 disabled:opacity-30"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default SimulationPage;
