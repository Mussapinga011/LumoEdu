import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { getQuestionsBySession, saveSessionProgress, getUserProgressByDiscipline } from '../services/practiceService';
import { checkAndAwardBadges } from '../services/badgeService';
import { PracticeQuestion } from '../types/practice';
import { Badge } from '../types/badge';
import { X, CheckCircle2, AlertCircle, Award } from 'lucide-react';
import clsx from 'clsx';
// @ts-ignore
import { useReward } from 'react-rewards';
import RichTextRenderer from '../components/RichTextRenderer';

const PracticeQuizPage = () => {
  const { disciplineId, sessionId } = useParams<{ disciplineId: string, sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { reward } = useReward('rewardId', 'confetti');

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  // Removed lives state
  
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime] = useState(Date.now());
  const [newBadges, setNewBadges] = useState<Badge[]>([]);

  const [isReplayMode, setIsReplayMode] = useState(false);
  const [showReplayIntro, setShowReplayIntro] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);
  const [isScoreImproved, setIsScoreImproved] = useState(false);

  useEffect(() => {
    if (!sessionId || !disciplineId) return;
    
    const initPage = async () => {
      setLoading(true);
      try {
        const [qData, pData] = await Promise.all([
          getQuestionsBySession(disciplineId, sessionId),
          user ? getUserProgressByDiscipline(user.uid, disciplineId) : Promise.resolve({} as Record<string, any>)
        ]);
        
        setQuestions(qData);
        
        if (pData[sessionId]?.completed) {
          setIsReplayMode(true);
          setShowReplayIntro(true);
          setBestScore(pData[sessionId].score || 0);
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [sessionId, disciplineId, user]);

  const handleCheck = () => {
    if (!selectedOption) return;

    const correct = selectedOption === questions[currentIndex].answer;
    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setScore(s => s + questions[currentIndex].xp);
      setCorrectAnswers(prev => prev + 1);
      reward();
    }
    // No more lives reduction
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setProgress(((currentIndex + 1) / questions.length) * 100);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsFinished(true);
    if (!user || !sessionId || !disciplineId) return;

    const timeTaken = (Date.now() - startTime) / 1000;
    const isPerfect = correctAnswers === questions.length;
    
    // Save process handles Replay logic internally now
    const result = await saveSessionProgress(user.uid, {
      sessionId,
      disciplineId: disciplineId,
      completed: true,
      score: Math.round((score / (questions.length * 10)) * 100),
      xpEarned: score,
      streak: 1
    });

    setEarnedXP(result.xpGranted);
    setIsScoreImproved(result.scoreImproved);

    // Check for badges with Zero Read optimization
    const earned = await checkAndAwardBadges(user.uid, user.badges || [], {
      sessionsCompleted: (user.examsCompleted || 0) + 1,
      perfectScores: isPerfect ? 1 : 0,
      currentStreak: (user.streak || 0) + 1,
      completionTime: timeTaken,
      disciplineId
    });

    if (earned.length > 0) {
      setNewBadges(earned);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>;
  if (questions.length === 0) return <div className="p-8 text-center">Nenhuma questão encontrada.</div>;

  // Replay Intro Screen
  if (showReplayIntro) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mb-6 animate-pulse">
           <AlertCircle size={48} />
        </div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Rever Sessão</h1>
        <p className="text-gray-500 font-medium mb-8">
          Você já concluiu esta sessão com <b>{bestScore}%</b> de aproveitamento. 
          Refaça para fixar o conteúdo e melhorar seu desempenho!
        </p>

        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 text-left">
          <h4 className="font-bold text-yellow-800 text-sm mb-1 uppercase tracking-wider flex items-center gap-2">
            <Award size={16} /> Recompensa de Replay
          </h4>
          <p className="text-xs text-yellow-700">
            Você ganhará <b>50% do XP</b> se superar sua pontuação anterior ({bestScore}%).
          </p>
        </div>

        <button 
          onClick={() => setShowReplayIntro(false)}
          className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-[0_6px_0_0_#1a4b2e] active:shadow-none active:translate-y-1 transition-all"
        >
          REVER CONTEÚDO
        </button>
        <button 
          onClick={() => navigate(`/practice/${disciplineId}`)}
          className="mt-4 text-gray-400 font-bold text-sm uppercase hover:text-gray-600"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div id="rewardId" />
        <div className="text-8xl mb-6">
          {isScoreImproved ? '🚀' : '🏆'}
        </div>
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
          {isReplayMode ? 'Sessão Revisada!' : 'Sessão Concluída!'}
        </h1>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
          {isScoreImproved 
            ? 'Fantástico! Você superou seu recorde anterior.' 
            : isReplayMode 
              ? 'Boa revisão! Continue praticando para manter o conhecimento fresco.'
              : 'Você mandou muito bem! Continue assim.'}
        </p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          <div className={clsx(
            "p-4 rounded-2xl border-b-4",
            earnedXP > 0 ? "bg-orange-100 border-orange-200" : "bg-gray-100 border-gray-200"
          )}>
            <div className={clsx("font-black text-2xl", earnedXP > 0 ? "text-orange-600" : "text-gray-500")}>
              +{earnedXP}
            </div>
            <div className={clsx("font-bold text-xs uppercase", earnedXP > 0 ? "text-orange-500" : "text-gray-400")}>
              XP Ganho
            </div>
          </div>
          <div className="bg-blue-100 p-4 rounded-2xl border-b-4 border-blue-200">
            <div className="text-blue-600 font-black text-2xl">{Math.round((score/(questions.length*10))*100)}%</div>
            <div className="text-blue-500 font-bold text-xs uppercase">Precisão</div>
          </div>
        </div>

        {newBadges.length > 0 && (
          <div className="w-full max-w-sm mb-8 animate-bounce-subtle">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
              <h3 className="text-yellow-700 font-black text-sm uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
                <Award size={18} /> Nova Conquista!
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {newBadges.map(badge => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.id} className="flex flex-col items-center gap-1 group">
                      <div className="p-3 bg-white rounded-full shadow-md border-2 border-yellow-400">
                        <Icon className={badge.color} size={28} />
                      </div>
                      <span className="text-xs font-black text-gray-700">{badge.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={() => navigate(`/practice/${disciplineId}`)}
          className="w-full max-w-sm bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-[0_6px_0_0_#1a4b2e] active:shadow-none active:translate-y-1 transition-all"
        >
          CONTINUAR
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-2xl mx-auto">
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

      {/* Question */}
      <div className="flex-1 px-6 py-8">
        <div className="text-2xl font-extrabold text-gray-800 mb-8">
          <RichTextRenderer content={currentQ.question} />
        </div>
        
        <div className="space-y-4">
          {currentQ.options.map((option, i) => (
            <button
              key={option}
              disabled={isAnswered}
              onClick={() => setSelectedOption(option)}
              className={clsx(
                "w-full p-4 text-left rounded-2xl border-2 font-bold text-lg transition-all flex items-center gap-4",
                selectedOption === option 
                  ? "border-blue-400 bg-blue-50 text-blue-600 shadow-[0_4px_0_0_#60a5fa]" 
                  : "border-gray-200 hover:bg-gray-50 text-gray-700 shadow-[0_4px_0_0_#e5e7eb]"
              )}
            >
              <span className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black border-2",
                selectedOption === option ? "border-blue-200 bg-white" : "border-gray-100 bg-gray-50 text-gray-400"
              )}>
                {String.fromCharCode(65 + i)}
              </span>
              <RichTextRenderer content={option} />
            </button>
          ))}
        </div>
      </div>

      {/* Footer / Feedback */}
      <div className={clsx(
        "p-6 pb-8 border-t-2 transition-colors",
        isAnswered 
          ? isCorrect ? "bg-green-100 border-green-200" : "bg-red-100 border-red-200"
          : "bg-white border-gray-100"
      )}>
        {isAnswered ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <CheckCircle2 size={32} className="text-green-600" />
              ) : (
                <AlertCircle size={32} className="text-red-600" />
              )}
              <div>
                <h3 className={clsx("font-black text-xl", isCorrect ? "text-green-700" : "text-red-700")}>
                  {isCorrect ? 'Muito bem!' : 'Solução correta:'}
                </h3>
                {!isCorrect && (
                  <div className="text-red-600 font-bold">
                    <RichTextRenderer content={currentQ.answer} />
                  </div>
                )}
              </div>
            </div>
            {currentQ.explanation && (
              <div className={clsx("text-sm font-medium", isCorrect ? "text-green-600" : "text-red-600")}>
                <RichTextRenderer content={currentQ.explanation} />
              </div>
            )}
            <button
              onClick={handleNext}
              className={clsx(
                "w-full py-4 rounded-2xl font-black text-lg transition-all shadow-[0_6px_0_0_#0000001a] active:shadow-none active:translate-y-1",
                isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
              )}
            >
              CONTINUAR
            </button>
          </div>
        ) : (
          <button
            disabled={!selectedOption} // Keep this check!
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
        )}
      </div>
    </div>
  );
};



export default PracticeQuizPage;
