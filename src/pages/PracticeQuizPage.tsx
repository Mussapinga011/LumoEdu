import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { getQuestionsBySession, saveSessionProgress, getUserProgressByDiscipline } from '../services/practiceService.supabase';
import { getLearningSectionsBySession } from '../services/contentService.supabase'; // Importe a função de teoria
import { checkAndAwardBadges } from '../services/badgeService';
import { PracticeQuestion } from '../types/practice';
import { X, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import clsx from 'clsx';
// @ts-ignore
import { useReward } from 'react-rewards';
import RichTextRenderer from '../components/RichTextRenderer';

// Definir tipos para os passos da aula
type StepType = 'theory' | 'question';
interface Step {
  id: string;
  type: StepType;
  data: any;
  orderIndex: number;
}

const PracticeQuizPage = () => {
  const { disciplineId, sectionId, sessionId } = useParams<{ disciplineId: string, sectionId?: string, sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { reward } = useReward('rewardId', 'confetti');

  // Estado Unificado
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estados de Quiz
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime] = useState(Date.now());

  const [isReplayMode, setIsReplayMode] = useState(false);
  const [showReplayIntro, setShowReplayIntro] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  useEffect(() => {
    if (!sessionId || !disciplineId) return;
    
    const initPage = async () => {
      setLoading(true);
      try {
        const [qData, tData, pData] = await Promise.all([
          getQuestionsBySession(sessionId!),               // Questões
          getLearningSectionsBySession(sessionId!),        // Teoria
          user ? getUserProgressByDiscipline(user.id, disciplineId!) : Promise.resolve({} as Record<string, any>)
        ]);
        
        // Mapear e unificar passos
        const theorySteps: Step[] = (tData || []).map((t: any) => ({
            id: t.id,
            type: 'theory',
            data: t,
            orderIndex: t.order_index || 0
        }));

        const questionSteps: Step[] = (qData || []).map((q: any) => ({
            id: q.id,
            type: 'question',
            data: q,
            orderIndex: (q.order || 0) + 1000 // Perguntas geralmente vêm depois da teoria se não houver ordem explícita
        }));

        // Combinar e ordenar
        // Se quisermos intercalar, precisamos confiar no orderIndex do banco. 
        // Por padrão no admin: Teoria tem orderIndex, Questão tem orderIndex.
        const allSteps = [...theorySteps, ...questionSteps].sort((a, b) => a.orderIndex - b.orderIndex);
        
        setSteps(allSteps);
        
        if (pData[sessionId!]?.completed) {
          setIsReplayMode(true);
          setShowReplayIntro(true);
          setBestScore(pData[sessionId!].score || 0);
        }
      } catch (error) {
        console.error('Error loading session content:', error);
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [sessionId, disciplineId, user]);

  const handleCheck = () => {
    const currentStep = steps[currentIndex];
    if (currentStep.type !== 'question') return; // Teoria não checa, só avança

    if (!selectedOption) return;

    const currentQ = currentStep.data as PracticeQuestion;
    const isCorrectResult = currentQ.options[currentQ.correctAnswer ?? currentQ.correctOption] === selectedOption;
    
    setIsCorrect(isCorrectResult);
    setIsAnswered(true);

    if (isCorrectResult) {
      setScore(s => s + (currentQ.xp || 10));
      setCorrectAnswers(prev => prev + 1);
      setConsecutiveErrors(0);
      reward();
    } else {
      setConsecutiveErrors(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < steps.length) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setProgress(((currentIndex + 1) / steps.length) * 100);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsFinished(true);
    if (!user || !sessionId || !disciplineId) return;

    const totalQuestions = steps.filter(s => s.type === 'question').length;
    
    // Se não houver perguntas (só teoria), score é 100%
    const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 100;
    const timeTaken = (Date.now() - startTime) / 1000;
    const isPerfect = correctAnswers === totalQuestions;
    
    const result = await saveSessionProgress(user.id, {
      sessionId,
      disciplineId,
      sectionId: sectionId || '',
      completed: true,
      score: finalScore,
      xpEarned: score + (totalQuestions === 0 ? 50 : 0), // XP base se for só leitura
      streak: 1
    });

    setEarnedXP(result.xp_earned || 0);

    await checkAndAwardBadges(user.id, [], {
      sessionsCompleted: (user.examsCompleted || 0) + 1,
      perfectScores: isPerfect && totalQuestions > 0 ? 1 : 0,
      currentStreak: (user.streak || 0) + 1,
      completionTime: timeTaken,
      disciplineId
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>
  );
  
  if (steps.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-32 h-32 mb-6 mx-auto">
          <img src="/lumo_mascot_Em_Duvida.png" alt="Lumo em Dúvida" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Sessão Vazia</h1>
        <p className="text-gray-500 font-medium mb-8">Não há conteúdo cadastrado nesta sessão.</p>
        <button onClick={() => navigate(-1)} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg">Voltar</button>
      </div>
    );
  }

  if (showReplayIntro) {
    // ... (Mantive o bloco de replay igual, apenas mudando bestScore type se necessário)
     return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-32 h-32 mb-6 mx-auto">
           <img src="/lumo_mascot_Estudando_em_duvida.png" alt="Lumo Pensando" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Rever Sessão</h1>
        <p className="text-gray-500 font-medium mb-8">
          Você já concluiu esta sessão com <b>{bestScore}%</b> de aproveitamento. 
          Refaça para fixar o conteúdo e melhorar seu desempenho!
        </p>
        
        {/* ... botões ... */}
        <button 
           onClick={() => setShowReplayIntro(false)}
           className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-[0_6px_0_0_#1a4b2e] active:shadow-none active:translate-y-1 transition-all"
         >
           REVER CONTEÚDO
         </button>
         <button onClick={() => navigate(-1)} className="mt-4 text-gray-400 font-bold text-sm uppercase hover:text-gray-600">Voltar</button>
      </div>
    );
  }

  if (isFinished) {
     const totalQuestions = steps.filter(s => s.type === 'question').length;
     const percentage = totalQuestions > 0 ? Math.round((correctAnswers/totalQuestions)*100) : 100;
     
     return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        {/* Confetti container removido daqui pois está no topo */}
        
        <div className="w-32 h-32 mb-6 mx-auto">
          <img src="/lumo_mascot_Conquista.png" alt="Lumo Celebrando" className="w-full h-full object-contain animate-bounce" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
          {isReplayMode ? 'Sessão Revisada!' : 'Sessão Concluída!'}
        </h1>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
           Mandou bem! Conteúdo finalizado.
        </p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          <div className={clsx("p-4 rounded-2xl border-b-4", earnedXP > 0 ? "bg-orange-100 border-orange-200" : "bg-gray-100 border-gray-200")}>
            <div className={clsx("font-black text-2xl", earnedXP > 0 ? "text-orange-600" : "text-gray-500")}>+{earnedXP}</div>
            <div className={clsx("font-bold text-xs uppercase", earnedXP > 0 ? "text-orange-500" : "text-gray-400")}>XP Ganho</div>
          </div>
          <div className="bg-blue-100 p-4 rounded-2xl border-b-4 border-blue-200">
            <div className="text-blue-600 font-black text-2xl">{percentage}%</div>
            <div className="text-blue-500 font-bold text-xs uppercase">Precisão</div>
          </div>
        </div>

        <button 
          onClick={() => {
            const path = sectionId ? `/practice/${disciplineId}/section/${sectionId}` : `/practice/${disciplineId}`;
            navigate(path);
          }}
          className="w-full max-w-sm bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-[0_6px_0_0_#1a4b2e] active:shadow-none active:translate-y-1 transition-all"
        >
          CONTINUAR
        </button>
      </div>
    );
  }

  const currentStep = steps[currentIndex];
  const isTheory = currentStep.type === 'theory';
  const currentQ = isTheory ? null : (currentStep.data as PracticeQuestion);

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-2xl mx-auto relative">
      <div id="rewardId" style={{ position: 'fixed', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 9999 }} />
      
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)}><X className="text-gray-400" /></button>
        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-y-auto custom-scrollbar">
        {isTheory ? (
          // RENDERIZAÇÃO DE TEORIA
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300 pb-20">
             <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] md:text-xs tracking-widest mb-2 md:mb-4 bg-primary/5 w-fit px-3 py-1 rounded-full">
                <BookOpen size={14} className="md:w-4 md:h-4" /> Material Teórico
             </div>
             <h2 className="text-2xl md:text-3xl font-black text-gray-800 leading-tight">{currentStep.data.title}</h2>
             <div className="w-full overflow-x-auto pb-6 px-6"> {/* Container de Scroll da Teoria */}
               <div className="prose prose-base md:prose-lg prose-slate text-gray-700 leading-relaxed max-w-none min-w-0">
                  <RichTextRenderer content={currentStep.data.content} />
               </div>
             </div>
          </div>
        ) : (
          // RENDERIZAÇÃO DE QUESTÃO
          <div className="animate-in fade-in slide-in-from-right duration-300 pb-24">
            {/* ENUNCIADO COM SCROLL PRÓPRIO */}
            <div className="w-full overflow-x-auto mb-6 md:mb-10 pb-6 px-6">
                <div className="text-lg md:text-2xl font-bold text-gray-800 leading-relaxed border-l-4 border-primary pl-4 md:pl-6 bg-gray-50/50 py-4 rounded-r-xl min-w-0">
                  <RichTextRenderer content={currentQ?.statement || (currentQ as any)?.question || ''} />
                </div>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              {currentQ?.options?.map((option, i) => (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => setSelectedOption(option)}
                  className={clsx(
                    "w-full p-4 md:p-6 text-left rounded-xl md:rounded-2xl border-2 font-medium text-base md:text-lg transition-all flex items-start gap-3 md:gap-5 group touch-manipulation overflow-hidden",
                    selectedOption === option 
                      ? "border-blue-400 bg-blue-50/50 text-blue-900 shadow-[0_2px_0_0_#60a5fa] md:shadow-[0_4px_0_0_#60a5fa] translate-y-[2px]" 
                      : "border-gray-100 bg-white hover:bg-gray-50 text-gray-700 shadow-[0_2px_0_0_#e5e7eb] md:shadow-[0_4px_0_0_#e5e7eb] active:translate-y-[2px] active:shadow-none"
                  )}
                >
                  <span className={clsx(
                    "w-7 h-7 md:w-8 md:h-8 rounded-lg flex shrink-0 items-center justify-center text-xs md:text-sm font-black border-2 transition-colors mt-0.5",
                    selectedOption === option ? "border-blue-200 bg-blue-100 text-blue-600" : "border-gray-100 bg-gray-50 text-gray-400 group-hover:bg-white group-hover:border-gray-200"
                  )}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <div className="w-full min-w-0 overflow-x-auto pb-6 px-6"> {/* Scroll individual da opção */}
                      <RichTextRenderer content={option} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Feedback */}
      <div className={clsx(
        "p-6 pb-8 border-t-2 transition-colors",
        isTheory 
          ? "bg-white border-gray-100" // Footer Teoria
          : isAnswered 
             ? isCorrect ? "bg-green-100 border-green-200" : "bg-red-100 border-red-200"
             : "bg-white border-gray-100"
      )}>
        {isTheory ? (
           <button
             onClick={handleNext}
             className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-[0_6px_0_0_#1a4b2e] active:shadow-none active:translate-y-1 transition-all"
           >
             ENTENDI, PRÓXIMO ➜
           </button>
        ) : (
           // Lógica de botão para Quiz
           isAnswered ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <CheckCircle2 size={32} className="text-green-600" />
                ) : consecutiveErrors >= 3 ? (
                  <div className="w-16 h-16 shrink-0">
                    <img src="/lumo_mascot_Exausto.png" alt="Lumo Exausto" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <AlertCircle size={32} className="text-red-600" />
                )}
                <div>
                  <h3 className={clsx("font-black text-xl", isCorrect ? "text-green-700" : "text-red-700")}>
                    {isCorrect ? 'Muito bem!' : consecutiveErrors >= 3 ? 'Calma! Vamos com mais atenção...' : 'Solução correta:'}
                  </h3>
                  {!isCorrect && (
                    <div className="text-red-600 font-bold w-full overflow-x-auto pb-6 px-6"> {/* Scroll da resposta correta no feedback */}
                      <div className="min-w-0">
                         <RichTextRenderer content={currentQ?.options[currentQ?.correctAnswer ?? currentQ?.correctOption] || ''} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {currentQ?.explanation && (
                <div className={clsx("text-sm font-medium w-full overflow-x-auto pb-6 px-6 border-l-4 pl-4 rounded bg-white/50", isCorrect ? "text-green-600 border-green-300" : "text-red-600 border-red-300")}>
                   <div className="min-w-0 prose prose-sm max-w-none text-current leading-relaxed">
                      <RichTextRenderer content={currentQ.explanation} />
                   </div>
                </div>
              )}
              <button
                onClick={handleNext}
                className={clsx(
                  "w-full py-4 rounded-2xl font-black text-lg transition-all shadow-[0_6px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1",
                  isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                )}
              >
                CONTINUAR
              </button>
            </div>
           ) : (
            <button
              disabled={!selectedOption}
              onClick={handleCheck}
              className={clsx(
                "w-full py-4 rounded-2xl font-black text-lg transition-all",
                selectedOption 
                  ? "bg-primary text-white shadow-[0_6px_0_0_#1a4b2e] active:shadow-none active:translate-y-1" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              VERIFICAR
            </button>
           )
        )}
      </div>
    </div>
  );
};

export default PracticeQuizPage;
