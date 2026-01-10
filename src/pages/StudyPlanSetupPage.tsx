import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { saveStudyPlan } from '../services/dbService.supabase';
import { StudyPlan } from '../types/user';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const questions = [
  {
    id: 'daysPerWeek',
    question: 'Quantos dias por semana você pode estudar?',
    options: ['1-2 dias', '3-4 dias', '5-6 dias', 'Todos os dias']
  },
  {
    id: 'timePerDay',
    question: 'Quanto tempo por dia você tem disponível?',
    options: ['30 minutos', '1 hora', '2 horas', 'Mais de 2 horas']
  },
  {
    id: 'goal',
    question: 'Qual é o seu principal objetivo?',
    options: ['Passar no Exame de Admissão', 'Melhorar notas escolares', 'Aprender por curiosidade', 'Desafio pessoal']
  },
  {
    id: 'weakSubject',
    question: 'Qual disciplina você considera mais difícil?',
    options: ['Matemática', 'Física', 'Português', 'Inglês', 'História', 'Geografia', 'Biologia', 'Química']
  },
  {
    id: 'strongSubject',
    question: 'Qual disciplina você considera mais fácil?',
    options: ['Matemática', 'Física', 'Português', 'Inglês', 'História', 'Geografia', 'Biologia', 'Química']
  },
  {
    id: 'learningStyle',
    question: 'Como você prefere aprender?',
    options: ['Lendo teoria', 'Resolvendo exercícios', 'Vídeos explicativos', 'Mistura de tudo']
  },
  {
    id: 'examDate',
    question: 'Quando será o seu exame?',
    options: ['Em menos de 1 mês', 'Em 1-3 meses', 'Em 3-6 meses', 'Mais de 6 meses']
  },
  {
    id: 'currentLevel',
    question: 'Como você avalia seu conhecimento atual?',
    options: ['Iniciante', 'Intermediário', 'Avançado']
  },
  {
    id: 'reminders',
    question: 'Você gostaria de receber lembretes diários?',
    options: ['Sim, por favor', 'Não, obrigado']
  },
  {
    id: 'commitment',
    question: 'Você está pronto para se comprometer com este plano?',
    options: ['Sim, estou pronto!', 'Vou tentar meu melhor']
  }
];

const StudyPlanSetupPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleAnswer = (answer: string) => {
    const updatedAnswers = { ...answers, [questions[currentStep].id]: answer };
    setAnswers(updatedAnswers);
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generatePlan(updatedAnswers);
    }
  };

  const generatePlan = async (finalAnswers: Record<string, string>) => {
    setLoading(true);
    
    // Logic remains same, just Supabase storage
    const timeOption = finalAnswers['timePerDay'];
    const examDateOption = finalAnswers['examDate'];
    
    let baseDailyGoal = 10;
    if (timeOption === '1 hora') baseDailyGoal = 20;
    if (timeOption === '2 horas') baseDailyGoal = 35;
    if (timeOption === 'Mais de 2 horas') baseDailyGoal = 50;

    let urgencyMultiplier = 1;
    if (examDateOption === 'Em menos de 1 mês') urgencyMultiplier = 1.5;
    if (examDateOption === 'Em 1-3 meses') urgencyMultiplier = 1.2;
    
    const dailyGoal = Math.round(baseDailyGoal * urgencyMultiplier);

    const daysOption = finalAnswers['daysPerWeek'];
    const weakSubject = finalAnswers['weakSubject'];
    const strongSubject = finalAnswers['strongSubject'];
    
    let availableDays: string[] = [];
    if (daysOption === '1-2 dias') availableDays = ['Sábado', 'Domingo'];
    else if (daysOption === '3-4 dias') availableDays = ['Segunda', 'Quarta', 'Sexta', 'Domingo'];
    else if (daysOption === '5-6 dias') availableDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    else availableDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    const newPlan: StudyPlan = {
      weeklySchedule: availableDays,
      weakTopics: [weakSubject, 'Revisão Geral', strongSubject],
      dailyGoal: dailyGoal,
      createdAt: new Date()
    };

    try {
      if (user) {
        await saveStudyPlan(user.id, newPlan);
        updateUser({ studyPlan: newPlan } as any);
        navigate('/profile');
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Erro ao salvar plano.");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
        <div className="h-3 bg-gray-100">
          <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-10">
          <div className="mb-10">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Passo {currentStep + 1} de {questions.length}</span>
            <h2 className="text-3xl font-black text-gray-800 mt-4 leading-tight tracking-tighter">
              {questions[currentStep].question}
            </h2>
          </div>

          <div className="space-y-3">
            {questions[currentStep].options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className="w-full text-left p-5 rounded-2xl border-2 border-gray-50 hover:border-primary hover:bg-primary/5 transition-all group flex items-center justify-between"
              >
                <span className="font-bold text-gray-600 group-hover:text-primary">{option}</span>
                <ArrowRight className="opacity-0 group-hover:opacity-100 text-primary translate-x-[-10px] group-hover:translate-x-0 transition-all" size={24} />
              </button>
            ))}
          </div>

          <div className="mt-10 flex justify-between items-center">
            {currentStep > 0 && (
              <button onClick={() => setCurrentStep(currentStep - 1)} className="text-gray-400 hover:text-gray-800 flex items-center gap-2 text-sm font-black transition-colors uppercase">
                <ArrowLeft size={16} /> Voltar
              </button>
            )}
            {loading && <div className="text-xs font-black text-primary animate-pulse uppercase">Construindo seu destino...</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPlanSetupPage;
