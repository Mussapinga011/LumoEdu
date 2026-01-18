import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExam, getQuestionsByExam } from '../services/examService.supabase';
import { addUserActivity, updateUserScore, updateUserProfile } from '../services/dbService.supabase';
import { Exam, Question } from '../types/exam';
import { useAuthStore } from '../stores/useAuthStore';
import { useAuth } from '../hooks/useAuth';
import { Timer, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import RichTextRenderer from '../components/RichTextRenderer';
import clsx from 'clsx';
import { useModal } from '../hooks/useNotifications';
import Modal from '../components/Modal';

const ChallengePage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, hasPremiumAccess } = useAuth();
  const { updateUser } = useAuthStore();
  const { modalState, showConfirm, closeModal } = useModal();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(90 * 60); 
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
    if (hasPremiumAccess) return;
    
    if (user.lastChallengeDate) {
      const lastDate = new Date(user.lastChallengeDate);
      const today = new Date();
      
      if (
        lastDate.getDate() === today.getDate() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getFullYear() === today.getFullYear()
      ) {
        setLimitReached(true);
      }
    }
  };

  useEffect(() => {
    if (!loading && !isFinished && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isFinished) {
      handleSubmit();
    }
  }, [loading, isFinished, timeLeft]);

  const fetchExamData = async (id: string) => {
    setLoading(true);
    try {
      const examData = await getExam(id);
      if (examData && examData.is_active === false && user?.role !== 'admin') {
        navigate('/challenge');
        return;
      }
      
      const questionsData = await getQuestionsByExam(id);
      
      setExam({
        id: examData.id,
        name: examData.title,
        disciplineId: examData.discipline_id,
        year: examData.year,
        season: examData.season
      } as any);

      const mappedQuestions: Question[] = (questionsData as any[]).map((q, index) => ({
        id: q.id,
        statement: q.question_text,
        options: q.options,
        correctOption: q.options[q.correct_answer],
        order: index + 1
      }));

      setQuestions(mappedQuestions);
    } catch (error) {
      console.error("Error fetching challenge data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!user || !exam) return;
    setIsFinished(true);
    
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctOption) correctCount++;
    });

    const accuracy = correctCount / questions.length;
    const finalScore = Math.round(accuracy * 20);
    setScore(finalScore);

    const updates = {
      challengesCompleted: (user.challengesCompleted || 0) + 1,
      lastChallengeDate: new Date()
    };

    await updateUserProfile(user.id, {
      challenges_completed: updates.challengesCompleted,
      last_challenge_date: updates.lastChallengeDate.toISOString()
    });

    await updateUserScore(user.id);
    await addUserActivity(user.id, {
      type: 'challenge',
      title: `Desafio: ${exam.name}`,
      score: finalScore
    });

    updateUser(updates as any);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 font-black text-primary animate-pulse">CARREGANDO DESAFIO...</div>;

  if (limitReached) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 mt-10">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border-4 border-gray-100">
           <div className="text-7xl">✋</div>
           <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Um de cada vez!</h2>
           <p className="text-gray-500 text-lg">Você já enfrentou o desafio de hoje. Descanse um pouco e volte amanhã, ou torne-se Premium para desafios infinitos!</p>
           <div className="flex flex-col md:flex-row gap-4 justify-center">
             <button onClick={() => navigate('/challenge')} className="px-8 py-3 bg-gray-100 rounded-2xl font-black">VOLTAR</button>
             <button onClick={() => navigate('/profile')} className="px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-lg">SER PREMIUM ⭐</button>
           </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const correctCount = questions.filter(q => answers[q.id] === q.correctOption).length;
    const percentage = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
           <div className="bg-white rounded-3xl shadow-xl p-10 text-center border-b-8 border-secondary">
              <div className="text-7xl mb-4">{percentage >= 70 ? '🦁' : '🐆'}</div>
              <h1 className="text-4xl font-black text-gray-800">Desafio Finalizado</h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">{exam?.name}</p>
           </div>

           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Nota', value: `${score}/20`, color: 'text-secondary' },
                { label: 'Acertos', value: correctCount, color: 'text-green-500' },
                { label: 'Precisão', value: `${percentage}%`, color: 'text-primary' },
                { label: 'Tempo', value: formatTime((90 * 60) - timeLeft), color: 'text-blue-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm text-center">
                   <div className={clsx("text-3xl font-black mb-1", stat.color)}>{stat.value}</div>
                   <div className="text-[10px] font-black text-gray-400 uppercase">{stat.label}</div>
                </div>
              ))}
           </div>

           <div className="bg-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row gap-4">
              <button onClick={() => navigate('/learning')} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg active:translate-y-1">🎯 MINHA JORNADA</button>
              <button onClick={() => navigate('/challenge')} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg active:translate-y-1">🏠 INÍCIO</button>
           </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Proteção: Se não houver questões ou questão atual, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Nenhuma questão disponível para este exame.</p>
          <button onClick={() => navigate('/challenge')} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-white">
      <div className="bg-white px-6 py-4 border-b-2 flex justify-between items-center shadow-sm z-10">
        <div>
           <h1 className="font-black text-gray-800 truncate max-w-[200px] leading-none uppercase tracking-tighter">{exam?.name}</h1>
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Questão {currentQuestionIndex + 1} de {questions.length}</span>
        </div>
        <div className={clsx("flex items-center gap-2 px-4 py-2 rounded-2xl font-black", timeLeft < 300 ? "bg-red-500 text-white animate-pulse" : "bg-blue-50 text-blue-600")}>
           <Timer size={20} />
           <span className="font-mono">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-32">
           <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex justify-between items-center">
                 <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-xl text-xs font-black uppercase">Questão #{currentQuestionIndex + 1}</span>
                 <button onClick={() => {
                   const id = currentQuestion.id;
                   setFlaggedQuestions(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
                 }} className={clsx("p-2 rounded-xl transition-all", flaggedQuestions.includes(currentQuestion.id) ? "bg-orange-500 text-white" : "bg-gray-50 text-gray-300 hover:text-orange-400")}>
                   <Flag size={20} />
                 </button>
              </div>

              <div className="text-xl md:text-2xl font-serif text-gray-800 leading-relaxed min-h-[100px]">
                 <RichTextRenderer content={currentQuestion.statement} />
              </div>

              <div className="space-y-3">
                 {currentQuestion.options.map((option, idx) => (
                    <button key={idx} onClick={() => setAnswers({ ...answers, [currentQuestion.id]: option })} className={clsx("w-full text-left p-5 rounded-3xl border-2 transition-all flex items-center gap-4 group", answers[currentQuestion.id] === option ? "border-primary bg-primary/5 shadow-md" : "border-gray-100 hover:border-gray-200")}>
                       <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center border-2 text-sm font-black transition-colors", answers[currentQuestion.id] === option ? "bg-primary border-primary text-white" : "bg-gray-50 border-gray-100 text-gray-300 group-hover:border-gray-300")}>
                          {String.fromCharCode(65 + idx)}
                       </div>
                       <div className="font-medium text-gray-700">
                          <RichTextRenderer content={option} />
                       </div>
                    </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="hidden lg:flex w-72 bg-gray-50 border-l p-6 flex-col">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">MAPA DA PROVA</h3>
           <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[60vh] p-1">
              {questions.map((q, idx) => (
                 <button key={idx} onClick={() => setCurrentQuestionIndex(idx)} className={clsx("aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all border-2 relative", currentQuestionIndex === idx ? "border-primary bg-primary text-white scale-110 z-10 shadow-lg" : answers[q.id] ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-100 bg-white text-gray-300")}>
                    {idx + 1}
                    {flaggedQuestions.includes(q.id) && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white" />}
                 </button>
              ))}
           </div>
           <button onClick={() => showConfirm('FINALIZAR?', 'Deseja entregar a prova agora?', handleSubmit)} className="mt-auto w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg hover:brightness-110 active:scale-95 transition-all">FINALIZAR PROVA</button>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 p-4 flex justify-between items-center z-20">
         <button onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} className="p-4 bg-gray-100 rounded-2xl text-gray-500"><ChevronLeft size={24} /></button>
         <button onClick={() => showConfirm('FINALIZAR?', 'Entrega agora?', handleSubmit)} className="px-10 py-3 bg-primary text-white rounded-2xl font-black shadow-md">ENTREGAR</button>
         <button onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))} className="p-4 bg-gray-100 rounded-2xl text-gray-500"><ChevronRight size={24} /></button>
      </div>

      <Modal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} />
    </div>
  );
};

export default ChallengePage;
