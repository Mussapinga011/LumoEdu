
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { AcademicTrackingService } from '../services/academicTrackingService';
import { supabase } from '../lib/supabase';
import { GraduationCap, BookOpen, Clock, AlertCircle, Calendar, Target, CheckSquare } from 'lucide-react';
import clsx from 'clsx';

interface QuestionOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface Step {
  id: string;
  question: string;
  description?: string;
  icon: any;
  type?: 'select' | 'multiselect' | 'date';
  options?: QuestionOption[];
}

const StudyPlanSetupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Lista Fixa de Universidades
  const universities: QuestionOption[] = [
    { value: 'UEM', label: 'UEM', subLabel: 'Universidade Eduardo Mondlane' },
    { value: 'UP', label: 'UP', subLabel: 'Universidade Pedagógica' },
    { value: 'ISCTEM', label: 'ISCTEM', subLabel: 'Inst. Sup. de Ciências e Tec.' },
    { value: 'Outra', label: 'Outra / Genérica', subLabel: 'Preparação Geral' }
  ];

  const courses: QuestionOption[] = [
    { value: 'Medicina', label: 'Medicina e Saúde', subLabel: 'Biologia + Química' },
    { value: 'Engenharia', label: 'Engenharias e Tecnologias', subLabel: 'Matemática + Física' },
    { value: 'Direito', label: 'Direito e Humanas', subLabel: 'Português + História' },
    { value: 'Economia', label: 'Economia e Gestão', subLabel: 'Matemática + Geografia' },
    { value: 'Arquitetura', label: 'Arquitetura e Planeamento', subLabel: 'Geometria + Desenho' },
    { value: 'Ciencias', label: 'Ciências Puras', subLabel: 'Biologia + Geografia + Química' }
  ];

  const weekDays: QuestionOption[] = [
    { value: 'Seg', label: 'Segunda-feira' },
    { value: 'Ter', label: 'Terça-feira' },
    { value: 'Qua', label: 'Quarta-feira' },
    { value: 'Qui', label: 'Quinta-feira' },
    { value: 'Sex', label: 'Sexta-feira' },
    { value: 'Sab', label: 'Sábado' },
    { value: 'Dom', label: 'Domingo' }
  ];

  const subjects: QuestionOption[] = [
    { value: 'Matemática', label: 'Matemática' },
    { value: 'Física', label: 'Física' },
    { value: 'Química', label: 'Química' },
    { value: 'Biologia', label: 'Biologia' },
    { value: 'Português', label: 'Português' },
    { value: 'História', label: 'História' },
    { value: 'Geografia', label: 'Geografia' },
    { value: 'Inglês', label: 'Inglês' }
  ];

  const steps: Step[] = [
    {
      id: 'university',
      question: 'Qual é o seu alvo?',
      description: 'Escolha a universidade onde você quer ingressar.',
      icon: GraduationCap,
      options: universities
    },
    {
      id: 'course',
      question: 'Qual curso você vai prestar?',
      description: 'Isso define as disciplinas que você precisa dominar.',
      icon: BookOpen,
      options: courses
    },
    {
      id: 'days',
      question: 'Quando você vai estudar?',
      description: 'Selecione os dias da semana disponíveis.',
      icon: Calendar,
      type: 'multiselect',
      options: weekDays
    },
    {
      id: 'time',
      question: 'Quanto tempo por dia?',
      description: 'Seja realista. Consistência vence intensidade.',
      icon: Clock,
      options: [
        { value: '30', label: '30 minutos', subLabel: 'Começando leve' },
        { value: '60', label: '1 hora', subLabel: 'Ritmo constante' },
        { value: '120', label: '2 horas', subLabel: 'Alta dedicação' },
        { value: '180', label: '3+ horas', subLabel: 'Foco total' }
      ]
    },
    {
      id: 'weaknesses',
      question: 'Onde você precisa de reforço?',
      description: 'Selecione as disciplinas que você acha mais difíceis.',
      icon: AlertCircle,
      type: 'multiselect',
      options: subjects
    }
  ];

  const toggleSelection = (stepId: string, value: string) => {
    const current = answers[stepId] || [];
    const newSelection = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    
    setAnswers(prev => ({ ...prev, [stepId]: newSelection }));
  };

  const handleNext = () => {
    const step = steps[currentStep];
    
    // Validação
    if (step.type === 'multiselect') {
      if (!answers[step.id] || answers[step.id].length === 0) {
        alert('Selecione pelo menos uma opção.');
        return;
      }
    } else {
      if (!answers[step.id]) {
        alert('Selecione uma opção.');
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      finishSetup(answers);
    }
  };

  const finishSetup = async (finalAnswers: Record<string, any>) => {
    setLoading(true);
    if (!user) return;

    try {
      const selectedUni = universities.find(u => u.value === finalAnswers.university);
      const selectedCourse = courses.find(c => c.value === finalAnswers.course);
      
      const studyMinutes = parseInt(finalAnswers.time) || 60;
      
      // Salvar Perfil Acadêmico
      await AcademicTrackingService.upsertStudentProfile({
        userId: user.id,
        targetUniversity: selectedUni?.label || 'Outra',
        targetCourse: selectedCourse?.label || finalAnswers.course,
        targetYear: new Date().getFullYear(),
        admissionExamDate: new Date(new Date().getFullYear(), 11, 15),
        totalStudyTime: 0,
        totalQuestionsAnswered: 0,
        overallAccuracy: 0,
        currentStreak: 0,
        weakTopics: finalAnswers.weaknesses || [] // Array de strings
      });

      // Salvar meta diária adaptada
      const questionsGoal = Math.ceil(studyMinutes / 3); // ~3 min por questão
      
      const today = new Date().toISOString().split('T')[0];
      
      // Forçar insert direto para garantir
      await AcademicTrackingService.createDailyGoal(user.id, new Date());
      // Update com valores personalizados
      await supabase.from('daily_goals').update({
        minutes_to_study: studyMinutes,
        questions_to_solve: questionsGoal,
        topics_to_review: finalAnswers.weaknesses || []
      }).eq('user_id', user.id).eq('goal_date', today);

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erro ao salvar plano. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Barra de Progresso */}
        <div className="bg-gray-100 h-2 w-full">
          <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
              <currentStepData.icon size={14} />
              Etapa {currentStep + 1} de {steps.length}
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">
              {currentStepData.question}
            </h1>
            <p className="text-gray-500 font-medium text-lg">
              {currentStepData.description}
            </p>
          </div>

          {/* Conteúdo Dinâmico */}
          <div className="space-y-3">
            {currentStepData.type === 'multiselect' ? (
              // Multi-Select
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentStepData.options?.map(opt => {
                  const isSelected = (answers[currentStepData.id] || []).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleSelection(currentStepData.id, opt.value)}
                      className={clsx(
                        "p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                        isSelected 
                          ? "border-primary bg-primary/5 text-primary shadow-sm" 
                          : "border-gray-100 bg-white text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <div className={clsx(
                        "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                         isSelected ? "bg-primary border-primary text-white" : "border-gray-300 bg-white"
                      )}>
                        {isSelected && <CheckSquare size={14} />}
                      </div>
                      <span className="font-bold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              // Single Select
              <div className="grid grid-cols-1 gap-3">
                {currentStepData.options?.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setAnswers(p => ({ ...p, [currentStepData.id]: opt.value }));
                      // Auto-advance for single select
                      setTimeout(() => {
                         if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
                         else finishSetup({ ...answers, [currentStepData.id]: opt.value });
                      }, 200);
                    }}
                    className={clsx(
                      "p-5 rounded-2xl border-2 text-left transition-all group hover:shadow-md flex justify-between items-center",
                      answers[currentStepData.id] === opt.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-gray-100 bg-white hover:border-primary/30"
                    )}
                  >
                    <div>
                      <div className="font-bold text-gray-800 text-lg group-hover:text-primary transition-colors">{opt.label}</div>
                      {opt.subLabel && <div className="text-gray-500 text-sm">{opt.subLabel}</div>}
                    </div>
                    {answers[currentStepData.id] === opt.value && <Target className="text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-white sticky bottom-0">
          {currentStep > 0 ? (
            <button 
              onClick={() => setCurrentStep(c => c - 1)}
              className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Voltar
            </button>
          ) : <div />}

          {/* Show Next button only for multiselect, or if selection made */}
          {(currentStepData.type === 'multiselect') && (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all active:translate-y-0"
            >
              Próximo
            </button>
          )}
          
          {loading && <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mr-4"></div>}
        </div>
      </div>
    </div>
  );
};

export default StudyPlanSetupPage;
