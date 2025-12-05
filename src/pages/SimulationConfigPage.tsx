import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '../stores/useContentStore';
import { useAuthStore } from '../stores/useAuthStore';
import { SimulationConfig, SimulationMode } from '../types/simulation';
import { generateSimulation } from '../services/simulationService';
import { Target, BookOpen, Flame, Shuffle, Settings, ArrowRight, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';

const SimulationConfigPage = () => {
  const navigate = useNavigate();
  const { disciplines, fetchDisciplines } = useContentStore();
  const { user } = useAuthStore();

  const [mode, setMode] = useState<SimulationMode>('weaknesses');
  const [questionCount, setQuestionCount] = useState<10 | 20 | 30 | 50>(20);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [includeAllDisciplines, setIncludeAllDisciplines] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<'UEM' | 'UP' | 'both'>('both');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string; type: 'error' | 'warning' } | null>(null);

  useEffect(() => {
    fetchDisciplines();
  }, [fetchDisciplines]);

  // Limpar erro após 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Bloqueio para usuários Free
  if (user && !user.isPremium) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-yellow-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
          
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target size={40} className="text-yellow-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simulados Personalizados
            <span className="block text-yellow-500 mt-2">Exclusivo Premium ⭐</span>
          </h1>

          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Crie simulados focados nas suas fraquezas, revise questões erradas e prepare-se com questões de nível difícil. Aumente suas chances de aprovação em até 3x!
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10 text-left">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Target size={18} className="text-red-500" /> Foco em Fraquezas
              </div>
              <p className="text-sm text-gray-500">O sistema identifica onde você precisa melhorar e cria provas específicas.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                <BookOpen size={18} className="text-blue-500" /> Modo Revisão
              </div>
              <p className="text-sm text-gray-500">Nunca erre a mesma questão duas vezes. Revise seus erros automaticamente.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Flame size={18} className="text-orange-500" /> Questões Difíceis
              </div>
              <p className="text-sm text-gray-500">Treine com as questões que a maioria dos estudantes erra.</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/profile')}
            className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xl font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all animate-pulse"
          >
            Desbloquear Agora 🚀
          </button>
          
          <p className="text-sm text-gray-400 mt-4">
            A partir de apenas 10 MZN/dia
          </p>
        </div>
      </div>
    );
  }

  const modes = [
    {
      id: 'weaknesses' as SimulationMode,
      name: 'Baseado em Fraquezas',
      description: 'Questões das disciplinas onde você tem pior desempenho',
      icon: Target,
      color: 'bg-red-100 text-red-600 border-red-200',
      recommended: true
    },
    {
      id: 'revision' as SimulationMode,
      name: 'Modo Revisão',
      description: 'Apenas questões que você errou anteriormente',
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-600 border-blue-200'
    },
    {
      id: 'difficult' as SimulationMode,
      name: 'Questões Difíceis',
      description: 'Questões que a maioria dos estudantes erra',
      icon: Flame,
      color: 'bg-orange-100 text-orange-600 border-orange-200'
    },
    {
      id: 'random' as SimulationMode,
      name: 'Aleatório',
      description: 'Questões variadas de todas as disciplinas',
      icon: Shuffle,
      color: 'bg-purple-100 text-purple-600 border-purple-200'
    },
    {
      id: 'custom' as SimulationMode,
      name: 'Personalizado',
      description: 'Escolha manualmente as disciplinas',
      icon: Settings,
      color: 'bg-gray-100 text-gray-600 border-gray-200'
    }
  ];

  const questionCounts = [10, 20, 30, 50];

  // Filtrar disciplinas por universidade selecionada
  const filteredDisciplines = selectedUniversity === 'both'
    ? disciplines
    : disciplines.filter(d => d.university === selectedUniversity);

  // Limpar disciplinas selecionadas ao trocar de universidade
  const handleUniversityChange = (university: 'UEM' | 'UP' | 'both') => {
    setSelectedUniversity(university);
    setSelectedDisciplines([]); // Limpar seleção ao trocar
    setIncludeAllDisciplines(false);
  };

  const handleDisciplineToggle = (disciplineId: string) => {
    if (selectedDisciplines.includes(disciplineId)) {
      setSelectedDisciplines(selectedDisciplines.filter(id => id !== disciplineId));
    } else {
      setSelectedDisciplines([...selectedDisciplines, disciplineId]);
    }
  };

  const handleStartSimulation = async () => {
    if (!user) return;

    // Validação
    if (mode === 'custom' && selectedDisciplines.length === 0 && !includeAllDisciplines) {
      setError({
        title: 'Seleção Necessária',
        message: 'Por favor, selecione pelo menos uma disciplina ou marque "Todas as disciplinas".',
        type: 'warning'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config: SimulationConfig = {
        mode,
        questionCount,
        disciplineIds: selectedDisciplines,
        includeAllDisciplines,
        university: selectedUniversity
      };

      const questions = await generateSimulation(user.uid, config);

      if (questions.length === 0) {
        setError({
          title: 'Nenhuma Questão Encontrada',
          message: 'Não encontramos questões com os critérios selecionados. Tente selecionar "Todas as disciplinas" ou mudar o modo para "Aleatório".',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      // Se encontrou menos questões do que o solicitado
      if (questions.length < questionCount) {
        // Opcional: Avisar o usuário, mas continuar
        // Por enquanto vamos continuar silenciosamente ou poderíamos mostrar um aviso
      }

      // Salvar configuração e questões no sessionStorage
      sessionStorage.setItem('simulationConfig', JSON.stringify(config));
      sessionStorage.setItem('simulationQuestions', JSON.stringify(questions));

      // Navegar para página de execução
      navigate('/simulation/start');
    } catch (error) {
      console.error('Error starting simulation:', error);
      setError({
        title: 'Erro ao Gerar',
        message: 'Ocorreu um erro ao gerar o simulado. Por favor, tente novamente.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 relative">
      {/* Toast de Erro */}
      {error && (
        <div className={clsx(
          "fixed top-4 right-4 z-50 max-w-md w-full p-4 rounded-xl shadow-2xl border-l-4 animate-slide-in flex items-start gap-3",
          error.type === 'error' ? "bg-white border-red-500 text-gray-800" : "bg-white border-yellow-500 text-gray-800"
        )}>
          <div className={clsx(
            "p-2 rounded-full shrink-0",
            error.type === 'error' ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
          )}>
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{error.title}</h3>
            <p className="text-gray-600 leading-relaxed">{error.message}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Criar Simulado Personalizado</h1>
        <p className="text-gray-500 mt-2">Configure seu simulado de acordo com suas necessidades de estudo</p>
      </div>

      {/* Modo de Simulado */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Escolha o Modo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modes.map((modeOption) => (
            <button
              key={modeOption.id}
              onClick={() => setMode(modeOption.id)}
              className={clsx(
                'relative p-4 rounded-xl border-2 text-left transition-all',
                mode === modeOption.id
                  ? `${modeOption.color} border-current shadow-lg`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              {modeOption.recommended && (
                <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Recomendado
                </span>
              )}
              <div className="flex items-start gap-3">
                <modeOption.icon size={24} className={mode === modeOption.id ? '' : 'text-gray-400'} />
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{modeOption.name}</h3>
                  <p className={clsx(
                    'text-sm',
                    mode === modeOption.id ? 'opacity-90' : 'text-gray-500'
                  )}>
                    {modeOption.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Número de Questões */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Número de Questões</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {questionCounts.map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count as any)}
              className={clsx(
                'p-4 rounded-xl border-2 font-bold transition-all',
                questionCount === count
                  ? 'bg-primary text-white border-primary shadow-lg'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary'
              )}
            >
              <div className="text-3xl mb-1">{count}</div>
              <div className="text-xs opacity-75">questões</div>
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          ⏱️ Tempo estimado: {Math.ceil(questionCount * 1.5)} - {questionCount * 2} minutos
        </p>
      </div>

      {/* Seleção de Universidade */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🎓 Faculdade</h2>
        <p className="text-sm text-gray-500 mb-4">
          Escolha de qual faculdade deseja as questões
        </p>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleUniversityChange('UEM')}
            className={clsx(
              'p-4 rounded-xl border-2 font-bold transition-all text-center',
              selectedUniversity === 'UEM'
                ? 'bg-blue-100 text-blue-700 border-blue-500 shadow-lg'
                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
            )}
          >
            <div className="text-2xl mb-1">🎓</div>
            <div className="text-sm">UEM</div>
          </button>
          <button
            onClick={() => handleUniversityChange('UP')}
            className={clsx(
              'p-4 rounded-xl border-2 font-bold transition-all text-center',
              selectedUniversity === 'UP'
                ? 'bg-green-100 text-green-700 border-green-500 shadow-lg'
                : 'bg-white border-gray-200 text-gray-700 hover:border-green-300'
            )}
          >
            <div className="text-2xl mb-1">🎓</div>
            <div className="text-sm">UP</div>
          </button>
          <button
            onClick={() => handleUniversityChange('both')}
            className={clsx(
              'p-4 rounded-xl border-2 font-bold transition-all text-center',
              selectedUniversity === 'both'
                ? 'bg-purple-100 text-purple-700 border-purple-500 shadow-lg'
                : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
            )}
          >
            <div className="text-2xl mb-1">🎓</div>
            <div className="text-sm">Ambas</div>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {selectedUniversity === 'both' 
            ? `Mostrando disciplinas de UEM e UP (${filteredDisciplines.length} disponíveis)`
            : `Mostrando apenas disciplinas da ${selectedUniversity} (${filteredDisciplines.length} disponíveis)`}
        </p>
      </div>

      {/* Seleção de Disciplinas (TODOS OS MODOS) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">📚 Disciplinas</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAllDisciplines}
              onChange={(e) => {
                setIncludeAllDisciplines(e.target.checked);
                if (e.target.checked) {
                  setSelectedDisciplines([]);
                }
              }}
              className="w-4 h-4 text-primary rounded"
            />
            <span className="text-sm font-medium text-gray-700">Todas as disciplinas</span>
          </label>
        </div>

        {!includeAllDisciplines && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {mode === 'custom' 
                ? 'Selecione pelo menos uma disciplina'
                : 'Selecione as disciplinas que deseja estudar (deixe vazio para todas da faculdade selecionada)'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredDisciplines.map((discipline) => (
                <button
                  key={discipline.id}
                  onClick={() => handleDisciplineToggle(discipline.id)}
                  className={clsx(
                    'p-3 rounded-xl border-2 text-left transition-all',
                    selectedDisciplines.includes(discipline.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="text-2xl mb-1">{discipline.icon}</div>
                  <div className="text-sm font-bold text-gray-800">{discipline.title}</div>
                  <div className="text-xs text-gray-500">{discipline.university}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedDisciplines.length > 0 && (
          <p className="text-sm text-gray-500 mt-3">
            ✅ {selectedDisciplines.length} disciplina(s) selecionada(s)
          </p>
        )}
      </div>

      {/* Botão Iniciar */}
      <div className="flex justify-end">
        <button
          onClick={handleStartSimulation}
          disabled={loading}
          className={clsx(
            'flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all shadow-lg',
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-hover active:scale-95'
          )}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Gerando Simulado...
            </>
          ) : (
            <>
              Iniciar Simulado
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SimulationConfigPage;
