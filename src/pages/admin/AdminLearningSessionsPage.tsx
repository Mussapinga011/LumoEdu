import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionsByDiscipline, saveSession, deleteSession } from '../../services/practiceService';
import { PracticeSession } from '../../types/practice';
import { Plus, Edit, Trash2, ArrowLeft, LayoutList, ChevronRight, Save, X, GripVertical, Eye, EyeOff } from 'lucide-react';
import { useModal, useToast } from '../../hooks/useNotifications';
import { getDiscipline, updateDiscipline } from '../../services/dbService';
import { Discipline } from '../../types/discipline';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import clsx from 'clsx';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableSessionProps {
  session: PracticeSession;
  onEdit: () => void;
  onDelete: () => void;
  onNavigate: () => void;
}

const SortableSession = ({ session, onEdit, onDelete, onNavigate }: SortableSessionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group bg-white"
    >
      <div className="flex items-center gap-4 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Arrastar para reordenar"
        >
          <GripVertical size={20} className="text-gray-400" />
        </button>
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-500 text-sm">
          {session.order}
        </div>
        <div>
          <h4 className="font-bold text-gray-800">{session.title}</h4>
          <p className="text-xs text-gray-400 font-medium">Nível {session.level} • {session.xpReward} XP</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onNavigate}
          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
        >
          Questões <ChevronRight size={16} />
        </button>
        <button onClick={onEdit} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
          <Edit size={18} />
        </button>
        <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const AdminLearningSessionsPage = () => {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<PracticeSession> | null>(null);
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const { modalState, showConfirm, closeModal } = useModal();
  const { toastState, showSuccess, showError, closeToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (disciplineId) {
      fetchSessions();
      fetchDiscipline();
    }
  }, [disciplineId]);

  const fetchDiscipline = async () => {
    try {
      const data = await getDiscipline(disciplineId!);
      setDiscipline(data);
    } catch (error) {
      console.error('Error fetching discipline:', error);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await getSessionsByDiscipline(disciplineId!);
      setSessions(data);
    } catch (error) {
      showError('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sessions.findIndex((s) => s.id === active.id);
      const newIndex = sessions.findIndex((s) => s.id === over.id);

      const newSessions = arrayMove(sessions, oldIndex, newIndex);
      
      // Update order property for all sessions
      const updatedSessions = newSessions.map((session, index) => ({
        ...session,
        order: index + 1
      }));

      setSessions(updatedSessions);

      // Save updated orders to database
      try {
        await Promise.all(
          updatedSessions.map(session => 
            saveSession(disciplineId!, { ...session, order: session.order })
          )
        );
        showSuccess('Ordem atualizada!');
      } catch (error) {
        showError('Erro ao salvar ordem');
        fetchSessions(); // Revert on error
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplineId || !editingSession?.title) return;

    try {
      await saveSession(disciplineId, {
        ...editingSession,
        disciplineId,
        order: editingSession.order || sessions.length + 1,
        xpReward: editingSession.xpReward || 50
      });
      showSuccess('Sessão salva com sucesso!');
      setIsModalOpen(false);
      fetchSessions();
    } catch (error) {
      showError('Erro ao salvar sessão');
    }
  };

  const handleDelete = (sessionId: string) => {
    showConfirm(
      'Excluir Sessão',
      'Tem certeza? Todas as questões desta sessão serão perdidas.',
      async () => {
        try {
          await deleteSession(disciplineId!, sessionId);
          showSuccess('Sessão excluída!');
          fetchSessions();
        } catch (error) {
          showError('Erro ao excluir');
        }
      }
    );
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest">Carregando sessões...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/learning')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
              {discipline?.title || 'Sessões de Aprendizado'}
            </h1>
            {discipline && (
              <span className={clsx(
                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                discipline.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {discipline.isActive ? 'Ativo' : 'Inibido'}
              </span>
            )}
          </div>
          <p className="text-gray-500 font-medium text-sm">Organize o currículo em módulos progressivos</p>
        </div>
        
        {discipline && (
          <button
            onClick={async () => {
              try {
                const newStatus = !discipline.isActive;
                await updateDiscipline(discipline.id, { isActive: newStatus });
                setDiscipline({ ...discipline, isActive: newStatus });
                showSuccess(`Disciplina ${newStatus ? 'ativada' : 'inibida'}`);
              } catch (error) {
                showError('Erro ao atualizar status');
              }
            }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all",
              discipline.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"
            )}
          >
            {discipline.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
            {discipline.isActive ? 'Inibir Curso' : 'Ativar Curso'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <LayoutList size={20} className="text-primary" />
            Estrutura do Curso
          </h3>
          <button
            onClick={() => {
              setEditingSession({ title: '', description: '', level: 1, xpReward: 50, order: sessions.length + 1 });
              setIsModalOpen(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary-hover transition-all flex items-center gap-2 text-sm"
          >
            <Plus size={18} />
            Nova Sessão
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {sessions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">Nenhuma sessão criada para esta disciplina.</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sessions.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {sessions.map((session) => (
                  <SortableSession
                    key={session.id}
                    session={session}
                    onEdit={() => { setEditingSession(session); setIsModalOpen(true); }}
                    onDelete={() => handleDelete(session.id)}
                    onNavigate={() => navigate(`/admin/learning/${disciplineId}/sessions/${session.id}/questions`)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                {editingSession?.id ? 'Editar Sessão' : 'Nova Sessão'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Título da Sessão</label>
                <input
                  type="text"
                  required
                  value={editingSession?.title}
                  onChange={e => setEditingSession({ ...editingSession, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ex: Introdução a Funções"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Descrição</label>
                <textarea
                  value={editingSession?.description}
                  onChange={e => setEditingSession({ ...editingSession, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="O que o aluno vai aprender..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Nível</label>
                  <input
                    type="number"
                    value={editingSession?.level}
                    onChange={e => setEditingSession({ ...editingSession, level: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Ordem</label>
                  <input
                    type="number"
                    value={editingSession?.order}
                    onChange={e => setEditingSession({ ...editingSession, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl active:scale-95 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Save size={20} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal {...modalState} onClose={closeModal} />
      {toastState.isOpen && <Toast {...toastState} onClose={closeToast} />}
    </div>
  );
};

export default AdminLearningSessionsPage;
