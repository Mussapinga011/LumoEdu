
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSectionsByDiscipline, saveSection, deleteSection } from '../../services/practiceService';
import { PracticeSection } from '../../types/practice';
import { Plus, Edit, Trash2, ArrowLeft, LayoutList, ChevronRight, Save, X, GripVertical, BookOpen } from 'lucide-react';
import { useModal, useToast } from '../../hooks/useNotifications';
import { getDiscipline } from '../../services/dbService';
import { Discipline } from '../../types/discipline';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
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

// We need to add deleteSection to practiceService or implement it here if it's just a firestore delete.
// For now, I'll simulate it or assume I should add it to service. I'll add it to service in next step if needed, 
// but I'll write the component assuming it exists or I can implement inline if I had the firesbase imports here. 
// Better to follow pattern and add to service. I will add `deleteSection` to `practiceService.ts` later or now.
// I will just use `deleteSession` placeholder and fix it. Actually, I can use `write_to_file` to update service too.
// Let's create the page first.

interface SortableSectionProps {
  section: PracticeSection;
  onEdit: () => void;
  onDelete: () => void;
  onNavigate: () => void;
}

const SortableSection = ({ section, onEdit, onDelete, onNavigate }: SortableSectionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

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
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-sm">
          {section.order}
        </div>
        <div>
          <h4 className="font-bold text-gray-800">{section.title}</h4>
          <p className="text-xs text-gray-400 font-medium">{section.description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onNavigate}
          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
        >
          Lições <ChevronRight size={16} />
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

const AdminLearningSectionsPage = () => {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const navigate = useNavigate();
  const [sections, setSections] = useState<PracticeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Partial<PracticeSection> | null>(null);
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
      fetchSections();
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

  const fetchSections = async () => {
    setLoading(true);
    try {
      const data = await getSectionsByDiscipline(disciplineId!);
      setSections(data);
    } catch (error) {
      showError('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (sectionId: string) => {
    showConfirm(
      'Excluir Sessão',
      'Tem certeza? Todas as etapas e questões desta sessão serão perdidas (mas permanecerão no banco se não deletadas manualmente).',
      async () => {
        try {
          await deleteSection(disciplineId!, sectionId);
          showSuccess('Sessão excluída!');
          fetchSections();
        } catch (error) {
          showError('Erro ao excluir');
        }
      }
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        order: index + 1
      }));

      setSections(updatedSections);

      try {
        await Promise.all(
          updatedSections.map(section => 
            saveSection(disciplineId!, { ...section, order: section.order })
          )
        );
        showSuccess('Ordem atualizada!');
      } catch (error) {
        showError('Erro ao salvar ordem');
        fetchSections();
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplineId || !editingSection?.title) return;

    try {
      await saveSection(disciplineId, {
        ...editingSection,
        disciplineId,
        order: editingSection.order || sections.length + 1
      });
      showSuccess('Seção salva com sucesso!');
      setIsModalOpen(false);
      fetchSections();
    } catch (error) {
      showError('Erro ao salvar seção');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest">Carregando seções...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/learning')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
            {discipline?.title ? `${discipline.title} - Sessões` : 'Sessões de Aprendizado'}
          </h1>
          <p className="text-gray-500 font-medium text-sm">Organize o curso em grandes blocos (Sessões)</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <LayoutList size={20} className="text-primary" />
            Estrutura de Sessões
          </h3>
          <button
            onClick={() => {
              setEditingSection({ title: '', description: '', order: sections.length + 1 });
              setIsModalOpen(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary-hover transition-all flex items-center gap-2 text-sm"
          >
            <Plus size={18} />
            Nova Sessão
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {sections.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
               <BookOpen size={40} className="mx-auto mb-2 opacity-20" />
               <p>Nenhuma seção criada.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    onEdit={() => { setEditingSection(section); setIsModalOpen(true); }}
                    onDelete={() => handleDelete(section.id)}
                    onNavigate={() => navigate(`/admin/learning/${disciplineId}/sections/${section.id}/sessions`)}
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
                {editingSection?.id ? 'Editar Sessão' : 'Nova Sessão'}
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
                  value={editingSection?.title}
                  onChange={e => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ex: Fundamentos de Matemática"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Descrição</label>
                <textarea
                  value={editingSection?.description}
                  onChange={e => setEditingSection({ ...editingSection, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="O que esta seção abrange..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Ordem</label>
                <input
                  type="number"
                  value={editingSection?.order}
                  onChange={e => setEditingSection({ ...editingSection, order: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
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

export default AdminLearningSectionsPage;
