import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExam, getQuestionsByExam, addUserActivity, updateUserScore, updateUserProfile, updateUserDisciplineScore } from '../services/dbService';
import { Exam, Question } from '../types/exam';
import { useAuthStore } from '../stores/useAuthStore';
import { Timer, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import RichTextRenderer from '../components/RichTextRenderer';
import { Timestamp } from 'firebase/firestore';
import clsx from 'clsx';
import { useModal } from '../hooks/useNotifications';
import Modal from '../components/Modal';

const ChallengePage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { modalState, showConfirm, closeModal } = useModal();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(90 * 30); // 90 minutes in seconds
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (examId && user) {
      checkDailyLimit();
      fetchExamData(examId);
    }
  }, [examId, user]);

  const checkDailyLimit = () => {
    if (!user) return;
    
    // Premium users bypass limits
    if (user.isPremium) return;
    
    // Check if user already took a challenge today
    if (user.lastChallengeDate) {
      const lastChallengeDate = user.lastChallengeDate.toDate();
      const today = new Date();
      
      if (
        lastChallengeDate.getDate() === today.getDate() &&
        lastChallengeDate.getMonth() === today.getMonth() &&
        lastChallengeDate.getFullYear() === today.getFullYear()
      ) {
        setLimitReached(true);
      }
    }
  };

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
      const examData = await getExam(id);
      
      // Check if exam is active (for non-admin users)
      if (examData && examData.isActive === false && user?.role !== 'admin') {
        navigate('/challenge');
        return;
      }
      
      const questionsData = await getQuestionsByExam(id);
      setExam(examData);
      setQuestions(questionsData);
    } catch (error) {
      console.error("Error fetching exam:", error);
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

    // Save activity & Update Stats
    const updates = {
      xp: (user.xp || 0) + (finalScore * 10),
      lastChallengeDate: Timestamp.now(),
      challengesCompleted: (user.challengesCompleted || 0) + 1
    };

    await updateUserProfile(user.uid, updates);
    await updateUserScore(user.uid);
    
    await addUserActivity(user.uid, {
      type: 'challenge',
      title: `Challenge: ${exam.name}`,
      timestamp: Timestamp.now(),
      score: finalScore,
      xpEarned: finalScore * 10
    });

    if (exam.disciplineId) {
       // 10 points per correct answer for discipline score
       await updateUserDisciplineScore(user.uid, exam.disciplineId, correctCount * 10);
    }

    updateUser(updates);
  };
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Carregando desafio...</div>;
  }

  if (limitReached) {
    // Tela padrão de limite diário
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
          <div className="text-6xl">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800">Limite Diário Atingido</h2>
          <p className="text-gray-600">
            Você já completou um desafio hoje. Volte amanhã ou atualize para Premium para desafios ilimitados!
          </p>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <h3 className="font-bold text-yellow-800 mb-2">Com Premium você tem:</h3>
            <ul className="text-left text-sm text-yellow-700 space-y-1">
              <li>✓ Desafios ilimitados por dia</li>
              <li>✓ Acesso ao Modo Aprender</li>
              <li>✓ Estatísticas detalhadas</li>
              <li>✓ Sem anúncios</li>
            </ul>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/challenge')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors"
            >
              ⭐ Atualizar para Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return <div className="text-center p-8">Exame não encontrado.</div>;
  }

  if (isFinished) {
    const correctAnswers = Object.keys(answers).filter(id => answers[id] === questions.find(q => q.id === id)?.correctOption).length;
    const incorrectAnswers = questions.length - correctAnswers;
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    const timeTaken = (90 * 30) - timeLeft;
    const minutesTaken = Math.floor(timeTaken / 60);
    const secondsTaken = timeTaken % 60;

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-gray-100">
            <div className="text-6xl mb-4">
              {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Desafio Concluído!</h1>
            <p className="text-gray-500">
              {percentage >= 80 ? 'Excelente desempenho!' : 
               percentage >= 60 ? 'Bom trabalho!' : 
               'Continue praticando!'}
            </p>
          </div>

          {/* Performance Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Relatório Detalhado</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">{score}/20</div>
                <div className="text-xs text-gray-500 font-bold uppercase mt-1">Nota Final</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
                <div className="text-xs text-gray-500 font-bold uppercase mt-1">Acertos</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <div className="text-3xl font-bold text-red-600">{incorrectAnswers}</div>
                <div className="text-xs text-gray-500 font-bold uppercase mt-1">Erros</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600">{percentage}%</div>
                <div className="text-xs text-gray-500 font-bold uppercase mt-1">Aproveitamento</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progresso</span>
                <span>{correctAnswers}/{questions.length} questões</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Time Taken */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Timer className="text-gray-400" size={20} />
                <span className="text-gray-700 font-medium">Tempo Utilizado</span>
              </div>
              <span className="font-bold text-gray-800">{minutesTaken}:{secondsTaken.toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/ranking')}
                className="flex items-center justify-center gap-2 bg-yellow-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-yellow-600 transition-colors"
              >
                🏆 Ver Ranking
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
              >
                🔄 Tentar Novamente
              </button>
              <button 
                onClick={() => navigate('/challenge')}
                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                🏠 Voltar ao Início
              </button>
            </div>
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
          onClick={() => navigate('/challenge')}
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
        <div className={clsx(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold",
          timeLeft < 300 ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600"
        )}>
          <Timer size={18} />
          {formatTime(timeLeft)}
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
                showConfirm(
                  'Finalizar Desafio',
                  'Tem certeza que deseja finalizar o desafio? Você não poderá mais alterar suas respostas.',
                  handleSubmit,
                  'Finalizar',
                  'Continuar'
                );
              }}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
            >
              Finalizar Desafio
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
            showConfirm(
              'Finalizar Desafio',
              'Tem certeza que deseja finalizar o desafio?',
              handleSubmit,
              'Finalizar',
              'Continuar'
            );
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

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
      />
    </div>
  );
};

export default ChallengePage;
