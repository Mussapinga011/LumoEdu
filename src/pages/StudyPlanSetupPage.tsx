import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { saveStudyPlan } from '../services/dbService.supabase';
import { StudyPlan } from '../types/user';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const questions = [
  {
    id: 'university',
    question: 'Qual universidade você deseja ingressar?',
    options: ['UEM (Univ. Eduardo Mondlane)', 'UP (Univ. Pedagógica)', 'UniZambeze', 'UEM + UP']
  },
  {
    id: 'courseGroup',
    question: 'Qual é o grupo de disciplinas do seu exame?',
    options: [
      'Matemática e Física (Engenharias)',
      'Biologia e Química (Medicina/Saúde)',
      'Português e História (Direito/Letras)',
      'Desenho e Geometria (Arquitetura)',
      'Geografia e Matemática (Economia)'
    ]
  },
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
    id: 'weakSubject',
    question: 'Em qual disciplina você sente maior dificuldade?',
    options: ['Matemática', 'Física', 'Português', 'Biologia', 'Química', 'História', 'Geografia']
  },
  {
    id: 'examDate',
    question: 'Quando será o seu exame?',
    options: ['Em menos de 1 mês', 'Em 1-3 meses', 'Em 3-6 meses', 'Mais de 6 meses']
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
    
    const university = finalAnswers['university'];
    const courseGroup = finalAnswers['courseGroup'];
    const timeOption = finalAnswers['timePerDay'];
    const examDateOption = finalAnswers['examDate'];
    
    // Mapeamento de disciplinas baseado no grupo
    let subjects: string[] = [];
    if (courseGroup.includes('Matemática e Física')) subjects = ['math', 'physics'];
    else if (courseGroup.includes('Biologia e Química')) subjects = ['biology', 'chemistry'];
    else if (courseGroup.includes('Português e História')) subjects = ['portuguese', 'history'];
    else if (courseGroup.includes('Desenho e Geometria')) subjects = ['drawing', 'geometry'];
    else if (courseGroup.includes('Geografia e Matemática')) subjects = ['geography', 'math'];

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
    
    let availableDays: string[] = [];
    if (daysOption === '1-2 dias') availableDays = ['Sábado', 'Domingo'];
    else if (daysOption === '3-4 dias') availableDays = ['Segunda', 'Quarta', 'Sexta', 'Domingo'];
    else if (daysOption === '5-6 dias') availableDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    else availableDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    const newPlan: StudyPlan = {
      targetUniversity: university,
      targetCourse: courseGroup.split('(')[1]?.replace(')', '') || courseGroup,
      subjects: subjects,
      weeklySchedule: availableDays,
      weakTopics: [weakSubject, 'Revisão Geral'],
      dailyGoal: dailyGoal,
      startDate: new Date().toISOString(),
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
