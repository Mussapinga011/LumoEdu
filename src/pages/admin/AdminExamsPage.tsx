import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllExams, deleteExam } from '../../services/dbService';
import { Exam } from '../../types/exam';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useContentStore } from '../../stores/useContentStore';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';

const AdminExamsPage = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const navigate = useNavigate();
  const { disciplines } = useContentStore();
  const { modalState, showConfirm, closeModal } = useModal();
  const { toastState, showSuccess, showError, closeToast } = useToast();
  const [examToDelete, setExamToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await getAllExams();
      setExams(data);
    } catch (error) {
      console.error("Error fetching exams:", error);
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setExamToDelete(id);
    showConfirm(
      'Excluir Exame',
      'Tem certeza que deseja excluir este exame? Esta ação não pode ser desfeita.',
      () => handleDeleteConfirm(id),
      'Excluir',
      'Cancelar'
    );
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteExam(id);
      setExams(exams.filter(e => e.id !== id));
      showSuccess('Exame excluído com sucesso!');
    } catch (error) {
      console.error("Error deleting exam:", error);
      showError(getErrorMessage(error));
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiscipline = selectedDiscipline === 'all' || exam.disciplineId === selectedDiscipline;
    return matchesSearch && matchesDiscipline;
  });

  if (loading) {
    return <div className="p-8 text-center">Carregando exames...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Exames</h1>
        <button
          onClick={() => navigate('/admin/exams/create')}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus size={20} />
          Criar Novo Exame
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar exames..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={selectedDiscipline}
          onChange={(e) => setSelectedDiscipline(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todas as Disciplinas</option>
          {disciplines.map(d => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Nome</th>
              <th className="p-4 font-semibold text-gray-600">Disciplina</th>
              <th className="p-4 font-semibold text-gray-600">Ano/Época</th>
              <th className="p-4 font-semibold text-gray-600">Questões</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Nenhum exame encontrado. Crie um para começar.
                </td>
              </tr>
            ) : (
              filteredExams.map((exam) => {
                const discipline = disciplines.find(d => d.id === exam.disciplineId);
                return (
                  <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{exam.name}</td>
                    <td className="p-4 text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600`}>
                        {discipline?.title || exam.disciplineId}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{exam.year} - {exam.season}</td>
                    <td className="p-4 text-gray-600">{exam.questionsCount}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/admin/exams/${exam.id}/edit`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(exam.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
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

      {/* Toast */}
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

export default AdminExamsPage;
