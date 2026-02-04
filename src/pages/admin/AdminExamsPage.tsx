import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllExams, deleteExam } from '../../services/examService.supabase';
import { Exam } from '../../types/exam';
import { 
  Plus, Edit2, Trash2, Search, Upload, 
  FileText, CheckCircle, 
  Filter, GraduationCap
} from 'lucide-react';
import { useContentStore } from '../../stores/useContentStore';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';
import clsx from 'clsx';

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
      'Tem certeza que deseja excluir este exame? Esta ação removerá permanentemente o exame e todas as suas questões.',
      () => handleDeleteConfirm(id),
      'Excluir permanentemente',
      'Cancelar'
    );
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteExam(id);
      setExams(exams.filter(e => e.id !== id));
      showSuccess('Exame removido com sucesso');
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiscipline = selectedDiscipline === 'all' || exam.disciplineId === selectedDiscipline;
    const matchesUniversity = selectedUniversity === 'all' || exam.universityId === selectedUniversity;
    return matchesSearch && matchesDiscipline && matchesUniversity;
  });

  const stats = {
    total: exams.length,
    active: exams.filter(e => e.isActive).length,
    disciplines: new Set(exams.map(e => e.disciplineId)).size
  };

  if (loading || (contentLoading && universities.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium animate-pulse">Carregando exames...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4">
      {/* HEADER & STATS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tight mb-2">Editor de Exames</h1>
          <p className="text-gray-500 font-medium">Gerencie e publique exames oficiais das universidades.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/admin/exams/bulk-import')}
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Upload size={20} className="text-green-500" />
            Importação em Massa
          </button>
          <button
            onClick={() => navigate('/admin/exams/create')}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            <Plus size={22} />
            Novo Exame
          </button>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total de Exames', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Exames Ativos', value: stats.active, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Disciplinas Atendidas', value: stats.disciplines, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((s, i) => (
          <div key={i} className={clsx("p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5", s.bg)}>
            <div className={clsx("p-3 rounded-2xl bg-white shadow-sm", s.color)}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none mb-1">{s.label}</p>
              <p className="text-2xl font-black text-gray-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por nome do exame..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <select
              value={selectedUniversity}
              onChange={(e) => {
                setSelectedUniversity(e.target.value);
                setSelectedDiscipline('all');
              }}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm appearance-none"
            >
              <option value="all">Todas Universidades</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>{u.shortName}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 md:w-56">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm appearance-none"
            >
              <option value="all">Todas Disciplinas</option>
              {disciplines
                .filter(d => selectedUniversity === 'all' || d.universityId === selectedUniversity)
                .map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* LIST VIEW */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Exame / Disciplina</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Instituição</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Ano</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-400 font-bold">Nenhum exame encontrado</td>
                </tr>
              ) : (
                filteredExams.map((exam) => {
                  const discipline = disciplines.find(d => d.id === exam.disciplineId);
                  const university = universities.find(u => u.id === exam.universityId);
                  return (
                    <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 group-hover:text-primary transition-colors">{exam.name}</span>
                          <span className="text-xs text-gray-400 font-medium">{discipline?.title || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase">
                          {university?.shortName || exam.universityId}
                        </span>
                      </td>
                      <td className="p-6 text-center text-gray-600 font-black text-sm">
                        {exam.year}
                      </td>
                      <td className="p-6 flex justify-center items-center">
                        <div className={clsx(
                          "w-2.5 h-2.5 rounded-full",
                          exam.isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-gray-300"
                        )} />
                      </td>
                      <td className="p-6 text-right">
                         <div className="flex justify-end gap-2 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => navigate(`/admin/exams/${exam.id}/edit`)} className="p-2 hover:text-primary hover:bg-gray-100 rounded-lg transition-all" title="Editar"><Edit2 size={18} /></button>
                            <button onClick={() => handleDeleteClick(exam.id)} className="p-2 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Excluir"><Trash2 size={18} /></button>
                         </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPONENTES GLOBAIS */}
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
