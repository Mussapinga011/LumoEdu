import { useState, useEffect } from 'react';
import { 
  getAllDisciplines, 
  createDiscipline, 
  updateDiscipline, 
  deleteDiscipline,
  getAllUniversities
} from '../../services/dbService';
import { Discipline } from '../../types/discipline';
import { University } from '../../types/university';
import { Search, Edit, Trash2, Plus, Save, X } from 'lucide-react';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';

const EMOJI_OPTIONS = ['📚', '🧮', '🔬', '🌍', '💻', '🎨', '⚖️', '🏥', '🏗️', '📊', '🎭', '🎵', '⚽', '🌱'];
const COLOR_OPTIONS = [
  { label: 'Azul', value: 'bg-blue-100 text-blue-600' },
  { label: 'Verde', value: 'bg-green-100 text-green-600' },
  { label: 'Roxo', value: 'bg-purple-100 text-purple-600' },
  { label: 'Rosa', value: 'bg-pink-100 text-pink-600' },
  { label: 'Laranja', value: 'bg-orange-100 text-orange-600' },
  { label: 'Amarelo', value: 'bg-yellow-100 text-yellow-600' },
  { label: 'Vermelho', value: 'bg-red-100 text-red-600' },
  { label: 'Índigo', value: 'bg-indigo-100 text-indigo-600' },
];

const AdminDisciplinesPage = () => {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    icon: '📚',
    color: 'bg-blue-100 text-blue-600',
    universityId: '',
    universityName: '',
    isActive: true
  });

  const { modalState, showConfirm, closeModal } = useModal();
  const { toastState, showSuccess, showError, closeToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [disciplinesData, universitiesData] = await Promise.all([
        getAllDisciplines(),
        getAllUniversities()
      ]);
      setDisciplines(disciplinesData);
      setUniversities(universitiesData);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.universityId) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }

    const university = universities.find(u => u.id === formData.universityId);
    if (!university) {
      showError('Selecione uma universidade válida');
      return;
    }

    const finalData = {
      ...formData,
      universityName: university.name
    };

    try {
      if (editingId) {
        await updateDiscipline(editingId, finalData);
        showSuccess('Disciplina atualizada com sucesso!');
      } else {
        await createDiscipline(finalData);
        showSuccess('Disciplina cadastrada com sucesso!');
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleEdit = (discipline: Discipline) => {
    setEditingId(discipline.id);
    setFormData({
      title: discipline.title,
      icon: discipline.icon,
      color: discipline.color,
      universityId: discipline.universityId,
      universityName: discipline.universityName,
      isActive: discipline.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    showConfirm(
      'Excluir Disciplina',
      'Tem certeza que deseja excluir esta disciplina? Todos os exames associados também serão afetados.',
      async () => {
        try {
          await deleteDiscipline(id);
          showSuccess('Disciplina excluída com sucesso!');
          fetchData();
        } catch (error) {
          showError(getErrorMessage(error));
        }
      }
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      icon: '📚',
      color: 'bg-blue-100 text-blue-600',
      universityId: '',
      universityName: '',
      isActive: true
    });
    setEditingId(null);
  };

  const filteredDisciplines = disciplines.filter(disc =>
    disc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disc.universityName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gerenciar Disciplinas</h1>
          <p className="text-gray-500">Adicione e gerencie as disciplinas por universidade</p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Disciplina
          </button>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar disciplinas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredDisciplines.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma disciplina encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-semibold text-gray-600">Disciplina</th>
                  <th className="p-4 font-semibold text-gray-600">Universidade</th>
                  <th className="p-4 font-semibold text-gray-600">Status</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredDisciplines.map((discipline) => (
                  <tr key={discipline.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl ${discipline.color}`}>
                          {discipline.icon}
                        </div>
                        <span className="font-medium text-gray-800">{discipline.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-600">{discipline.universityName}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        discipline.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {discipline.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(discipline)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(discipline.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">
                {editingId ? 'Editar Disciplina' : 'Nova Disciplina'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Disciplina *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="Ex: Matemática"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Universidade *
                </label>
                <select
                  value={formData.universityId}
                  onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                >
                  <option value="">Selecione uma universidade</option>
                  {universities.filter(u => u.isActive).map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} ({uni.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ícone *
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      className={`p-3 text-2xl rounded-lg border-2 transition-all ${
                        formData.icon === emoji
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_OPTIONS.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: colorOption.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.color === colorOption.value
                          ? 'border-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-full h-8 rounded ${colorOption.value} flex items-center justify-center font-bold text-sm`}>
                        {colorOption.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Disciplina Ativa
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
      />

      {toastState.isOpen && (
        <Toast
          message={toastState.message}
          type={toastState.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default AdminDisciplinesPage;
