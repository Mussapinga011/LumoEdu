import { useState } from 'react';
import { AcademicAI } from '../../services/academicAI.service';
import type { OptimizedSchedule } from '../../types/academicAI';
import { Calendar, Clock, TrendingUp, Target, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import clsx from 'clsx';

interface OptimizedSchedulePanelProps {
  userId: string;
  onClose: () => void;
}

const OptimizedSchedulePanel = ({ userId, onClose }: OptimizedSchedulePanelProps) => {
  const [schedule, setSchedule] = useState<OptimizedSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [examDate, setExamDate] = useState('');

  const generateSchedule = async () => {
    if (!examDate) {
      alert('Por favor, defina a data do exame');
      return;
    }

    setLoading(true);
    try {
      const targetDate = new Date(examDate);
      const optimized = await AcademicAI.optimizeSchedule(userId, hoursPerDay, targetDate);
      setSchedule(optimized);
    } catch (error) {
      console.error('Erro ao gerar cronograma:', error);
      alert('Erro ao gerar cronograma. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle size={14} className="text-red-600" />;
      case 'high':
        return <Zap size={14} className="text-orange-600" />;
      case 'medium':
        return <Target size={14} className="text-yellow-600" />;
      default:
        return <CheckCircle2 size={14} className="text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Calendar size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black">Cronograma Otimizado</h2>
                <p className="text-indigo-100 text-sm">Gerado por IA com base em suas lacunas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Configurações */}
          {!schedule && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="text-sm font-bold text-indigo-100 block mb-2">
                  Horas disponíveis por dia
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-indigo-200 font-bold focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-indigo-100 block mb-2">
                  Data do exame
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/20 border border-white/30 text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
            </div>
          )}

          {/* Métricas (se cronograma gerado) */}
          {schedule && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} />
                  <span className="text-xs font-bold uppercase text-indigo-100">Score Esperado</span>
                </div>
                <p className="text-3xl font-black">{schedule.expectedFinalScore}%</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={16} />
                  <span className="text-xs font-bold uppercase text-indigo-100">Fraquezas</span>
                </div>
                <p className="text-3xl font-black">{schedule.weaknessesAddressed}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} />
                  <span className="text-xs font-bold uppercase text-indigo-100">Total Horas</span>
                </div>
                <p className="text-3xl font-black">{schedule.totalStudyHours}h</p>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {!schedule ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                Configure seu Cronograma Personalizado
              </h3>
              <p className="text-gray-500 mb-6">
                A IA vai criar uma agenda otimizada priorizando seus pontos fracos
              </p>
              <button
                onClick={generateSchedule}
                disabled={loading}
                className={clsx(
                  'px-8 py-3 rounded-xl font-bold shadow-lg transition-all',
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:-translate-y-0.5'
                )}
              >
                {loading ? 'Gerando...' : '🧠 Gerar Cronograma com IA'}
              </button>
            </div>
          ) : schedule.schedule.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="mx-auto text-green-500 mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                Parabéns! Você não tem lacunas críticas
              </h3>
              <p className="text-gray-500">
                Continue praticando para manter seu nível
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {schedule.schedule.map((day, dayIdx) => (
                <div key={dayIdx} className="border border-gray-200 rounded-2xl overflow-hidden">
                  {/* Cabeçalho do Dia */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                        {dayIdx + 1}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800">{day.day}</h4>
                        <p className="text-xs text-gray-500">
                          {day.sessions.length} sessão{day.sessions.length > 1 ? 'ões' : ''} • {' '}
                          {day.sessions.reduce((sum, s) => sum + s.duration, 0)} min
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sessões do Dia */}
                  <div className="p-4 space-y-3">
                    {day.sessions.map((session, sessionIdx) => (
                      <div
                        key={sessionIdx}
                        className={clsx(
                          'p-4 rounded-xl border-2 transition-all hover:shadow-md',
                          getPriorityColor(session.priority)
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-600" />
                            <span className="font-bold text-sm">{session.time}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs font-bold">{session.duration}min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getPriorityIcon(session.priority)}
                            <span className="text-[10px] font-black uppercase">
                              {session.priority}
                            </span>
                          </div>
                        </div>
                        <h5 className="font-black text-gray-800 mb-1">{session.topicName}</h5>
                        <p className="text-xs text-gray-600">
                          Ganho esperado: <strong>+{session.expectedGain}%</strong>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {schedule && schedule.schedule.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              💡 <strong>Dica:</strong> Siga este cronograma para maximizar seu aprendizado
            </p>
            <button
              onClick={() => setSchedule(null)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Gerar Novo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedSchedulePanel;
