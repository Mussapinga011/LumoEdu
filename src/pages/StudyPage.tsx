import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { getExam, getQuestionsByExam } from '../services/examService.supabase';
import { updateUserProfile, updateUserScore } from '../services/dbService.supabase';
import { Exam, Question } from '../types/exam';
import { ArrowLeft, Check, X } from 'lucide-react';
import clsx from 'clsx';
import RichTextRenderer from '../components/RichTextRenderer';

const StudyPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitReached, setLimitReached] = useState(false);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (examId && user) {
      checkDailyLimit();
      fetchData(examId);
    }
  }, [examId, user]);

  const checkDailyLimit = () => {
    if (!user) return;
    if (!user.isPremium && user.role !== 'admin') {
      setLimitReached(true);
      return;
    }
  };

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      const examData = await getExam(id);
      if (examData && examData.is_active === false && user?.role !== 'admin') {
        navigate('/disciplines');
        return;
      }
      
      const questionsData = await getQuestionsByExam(id);
      
      // Mapear campos do Supabase
      const mappedExam: Exam = {
        id: examData.id,
        name: examData.title,
        disciplineId: examData.discipline_id,
        year: examData.year,
        season: examData.season,
        questionsCount: examData.questions_count,
        createdAt: examData.created_at
      };

      const mappedQuestions: Question[] = (questionsData as any[]).map(q => ({
        id: q.id,
        examId: q.exam_id,
        statement: q.question_text,
        options: q.options,
        correctOption: q.options[q.correct_answer],
        explanation: q.explanation,
        difficulty: q.difficulty,
        order: q.order_index
      }));

      setExam(mappedExam);
      setQuestions(mappedQuestions);
    } catch (error) {
      console.error("Error fetching study data:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleCheck = () => {
    if (!selectedOption || !currentQuestion) return;

    if (selectedOption === currentQuestion.correctOption) {
      setStatus('correct');
      setCorrectCount(prev => prev + 1);
    } else {
      setStatus('incorrect');
    }
  };

  const handleNext = async () =>{
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setStatus('idle');
    } else {
      // Exam Completed
      if (user) {
        const grade = Math.round((correctCount / questions.length) * 100);
        const newExamsCompleted = (user.examsCompleted || 0) + 1;
        const newAverageGrade = user.examsCompleted 
          ? ((user.averageGrade * user.examsCompleted) + grade) / newExamsCompleted
          : grade;

        const updates = {
          dailyExercisesCount: (user.dailyExercisesCount || 0) + questions.length, // Counts for daily exercises statistic
          lastExamDate: new Date(),
          examsCompleted: newExamsCompleted,
          averageGrade: Math.round(newAverageGrade)
        };

        await updateUserProfile(user.id, {
          daily_exercises_count: updates.dailyExercisesCount,
          last_exam_date: updates.lastExamDate.toISOString(),
          exams_completed: updates.examsCompleted,
          average_grade: updates.averageGrade
        });
        await updateUserScore(user.id);
        
        // O store precisa de atualização também
        updateUser(updates);
      }
      setShowSummary(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (limitReached) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 mt-10">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border-4 border-yellow-100">
          <div className="text-7xl">🌟</div>
          <h2 className="text-3xl font-black text-gray-800">Modo Estudo - Premium</h2>
          <p className="text-gray-600 text-lg">
            O Modo Estudo guiado é exclusivo para membros Premium da LumoEdu. Estude com explicações detalhadas e questões ilimitadas!
          </p>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
            <h3 className="font-bold text-yellow-800 mb-4 text-xl">Dourado - Vantagens:</h3>
            <ul className="text-left text-base text-yellow-700 space-y-3">
              <li className="flex items-center gap-2 font-medium">✨ Explicações detalhadas em cada questão</li>
              <li className="flex items-center gap-2 font-medium">✨ Acesso ilimitado a todos os exames</li>
              <li className="flex items-center gap-2 font-medium">✨ Estatísticas personalizadas de evolução</li>
            </ul>
          </div>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/disciplines')}
              className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all text-lg"
            >
              Voltar
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="px-8 py-4 bg-yellow-500 text-white rounded-2xl font-black hover:bg-yellow-600 transition-all text-lg shadow-[0_4px_0_0_#d97706] active:shadow-none active:translate-y-1"
            >
              SEJA PREMIUM AGORA! 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8">
        <div className="text-8xl mb-6">🏜️</div>
        <h2 className="text-3xl font-black text-gray-800 mb-2 text-center">Deserto de Questões</h2>
        <p className="text-gray-500 mb-8 max-w-md text-center">Incrível! Você explorou tanto que chegamos onde o Lumo ainda não colocou questões. Volte daqui a pouco!</p>
        <button
          onClick={() => navigate('/disciplines')}
          className="bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:bg-primary-hover shadow-lg transition-transform active:scale-95"
        >
          Explorar outras áreas
        </button>
      </div>
    );
  }

  if (showSummary) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center border-b-8 border-primary">
            <div className="text-7xl mb-6">{percentage >= 80 ? '🥇' : percentage >= 60 ? '🥈' : '🥉'}</div>
            <h1 className="text-4xl font-black text-gray-800 mb-2">Estudo Concluído!</h1>
            <p className="text-xl text-gray-500 font-medium">{exam.name}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Questões', value: questions.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Acertos', value: correctCount, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Erros', value: questions.length - correctCount, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Aproveitamento', value: `${percentage}%`, color: 'text-purple-600', bg: 'bg-purple-50' }
              ].map((stat, i) => (
                <div key={i} className={clsx("p-4 rounded-2xl", stat.bg)}>
                  <div className={clsx("text-3xl font-black", stat.color)}>{stat.value}</div>
                  <div className="text-[10px] uppercase font-black text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-bold text-gray-600 text-sm">
                <span>Precisão Geral</span>
                <span>{percentage}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden border">
                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percentage}%` }} />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center border border-blue-200">
               <span className="font-bold text-blue-800">Próximos Passos:</span>
               <span className="text-xl font-black text-blue-600">Continuar Praticando 📚</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate(`/disciplines/${exam.disciplineId}/exams`)}
              className="py-4 bg-primary text-white rounded-2xl font-black text-xl shadow-[0_4px_0_0_#1a4b2e] active:shadow-none active:translate-y-1 transition-all"
            >
              CONTINUAR 📚
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-xl hover:bg-gray-200 transition-all"
            >
              MEU PERFIL 👤
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-white overflow-hidden">
      <div className="h-1 bg-gray-100">
        <div 
          className="h-full bg-primary transition-all duration-300" 
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white px-4 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/disciplines/${exam.disciplineId}/exams`)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-primary transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-black text-gray-800 max-w-[150px] md:max-w-md truncate leading-none">{exam.name}</h1>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentQuestionIndex + 1} de {questions.length}</span>
          </div>
        </div>
        <div className="bg-secondary/10 text-secondary px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-tighter">
          Modo Estudo
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-lg md:text-2xl font-serif text-gray-800 leading-relaxed">
              <RichTextRenderer content={currentQuestion.statement} />
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => status === 'idle' && setSelectedOption(option)}
                  disabled={status !== 'idle'}
                  className={clsx(
                    "w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 relative group",
                    selectedOption === option ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200",
                    status === 'correct' && option === currentQuestion.correctOption && "border-green-500 bg-green-50",
                    status === 'incorrect' && option === selectedOption && "border-red-500 bg-red-50"
                  )}
                >
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center border-2 text-sm font-black shrink-0",
                    status === 'correct' && option === currentQuestion.correctOption ? "border-green-500 bg-green-500 text-white" :
                    status === 'incorrect' && option === selectedOption ? "border-red-500 bg-red-500 text-white" :
                    selectedOption === option ? "border-primary bg-primary text-white" : "border-gray-100 bg-gray-50 text-gray-300"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="flex-1 font-medium">
                    <RichTextRenderer content={option} />
                  </div>
                </button>
              ))}
            </div>

            {status !== 'idle' && (
              <div className={clsx(
                "p-6 rounded-3xl border-2 animate-in slide-in-from-bottom-2 duration-300",
                status === 'correct' ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              )}>
                <div className="flex gap-4 mb-4">
                  <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", status === 'correct' ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
                    {status === 'correct' ? <Check size={28} strokeWidth={4} /> : <X size={28} strokeWidth={4} />}
                  </div>
                  <div>
                    <h3 className={clsx("text-2xl font-black", status === 'correct' ? "text-green-800" : "text-red-800")}>
                      {status === 'correct' ? 'ESPETACULAR! ✨' : 'OPS! QUASE ISSO... 💡'}
                    </h3>
                  </div>
                </div>

                {status === 'incorrect' && (
                  <div className="mb-4 bg-white/50 p-4 rounded-xl border border-red-100">
                     <span className="text-xs font-black text-red-400 uppercase block mb-1">A CORRETA ERA:</span>
                     <div className="text-red-900 font-bold"><RichTextRenderer content={currentQuestion.correctOption} /></div>
                  </div>
                )}

                {currentQuestion.explanation && (
                  <div className="bg-white/80 p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Por que?</span>
                    <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
                      <RichTextRenderer content={currentQuestion.explanation} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex w-80 bg-gray-50 border-l border-gray-100 flex-col p-6 space-y-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">NAVEGAÇÃO</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={clsx(
                  "aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all border-2",
                  currentQuestionIndex === idx ? "border-primary bg-primary text-white scale-110 shadow-lg" : "border-gray-100 bg-white text-gray-300"
                )}
              >
                {idx + 1}
              </div>
            ))}
          </div>

          <div className="mt-auto bg-white p-4 rounded-2xl border border-gray-200">
             <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">📚</div>
                <div>
                   <p className="leading-tight">Progresso</p>
                   <p className="text-xs text-gray-400">{currentQuestionIndex + 1}/{questions.length} Questões</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-white border-t border-gray-100 z-20">
        <div className="max-w-2xl mx-auto">
          {status === 'idle' ? (
            <button
              onClick={handleCheck}
              disabled={!selectedOption}
              className={clsx(
                "w-full py-4 rounded-2xl font-black text-xl uppercase tracking-tighter transition-all shadow-[0_6px_0_0_#1a4b2e] active:shadow-none active:translate-y-1.5",
                selectedOption ? "bg-primary text-white" : "bg-gray-100 text-gray-300 shadow-none cursor-not-allowed"
              )}
            >
              VERIFICAR RESPOSTA
            </button>
          ) : (
            <button
               onClick={handleNext}
               className={clsx(
                 "w-full py-4 rounded-2xl font-black text-xl uppercase tracking-tighter transition-all active:translate-y-1.5",
                 status === 'correct' ? "bg-green-500 text-white shadow-[0_6px_0_0_#15803d]" : "bg-red-500 text-white shadow-[0_6px_0_0_#b91c1c]"
               )}
            >
              {currentQuestionIndex === questions.length - 1 ? 'FINALIZAR ESTUDO 🏁' : 'PRÓXIMA QUESTÃO 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPage;
