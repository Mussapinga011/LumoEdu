import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllExams, deleteExam } from '../../services/examService.supabase';
import { Exam } from '../../types/exam';
import { Plus, Edit, Trash2, Search, Upload } from 'lucide-react';
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
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');
  const navigate = useNavigate();
  const { disciplines, universities, fetchContent, loading: contentLoading } = useContentStore();
  const { modalState, showConfirm, closeModal } = useModal();
  const { toastState, showSuccess, showError, closeToast } = useToast();

  useEffect(() => {
    fetchExams();
    fetchContent();
  }, [fetchContent]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await getAllExams();
      // Mapear campos do Supabase
      const mappedExams: Exam[] = (data as any[]).map(e => ({
        id: e.id,
        name: e.title,
        disciplineId: e.discipline_id,
        universityId: e.university_id,
        university: e.university_id,
        year: e.year,
        season: e.season,
        questionsCount: e.questions_count,
        isActive: e.is_active,
        createdAt: e.created_at
      }));
      setExams(mappedExams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
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
    const matchesUniversity = selectedUniversity === 'all' || exam.universityId === selectedUniversity;
    
    return matchesSearch && matchesDiscipline && matchesUniversity;
  });

  if (loading || (contentLoading && universities.length === 0)) {
    return (
       <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
       </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Exames</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/exams/bulk-import')}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload size={20} />
            Importação em Massa
          </button>
          <button
            onClick={() => navigate('/admin/exams/create')}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Criar Novo Exame
          </button>
        </div>
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
          value={selectedUniversity}
          onChange={(e) => {
            setSelectedUniversity(e.target.value);
            setSelectedDiscipline('all');
          }}
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todas as Universidades</option>
          {universities.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
          ))}
        </select>
        <select
          value={selectedDiscipline}
          onChange={(e) => setSelectedDiscipline(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todas as Disciplinas</option>
          {disciplines
            .filter(d => selectedUniversity === 'all' || d.universityId === selectedUniversity)
            .map(d => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Nome</th>
                <th className="p-4 font-semibold text-gray-600">Disciplina</th>
                <th className="p-4 font-semibold text-gray-600">Universidade</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Ano/Época</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhum exame encontrado.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => {
                  const discipline = disciplines.find(d => d.id === exam.disciplineId);
                  const university = universities.find(u => u.id === exam.universityId);
                  return (
                    <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-800">{exam.name}</td>
                      <td className="p-4 text-gray-600">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                          {discipline?.title || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                          {university?.shortName || exam.universityId || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          exam.isActive
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          {exam.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{exam.year} - {exam.season}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`/admin/exams/${exam.id}/edit`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(exam.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      </div>

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

export default AdminExamsPage;
