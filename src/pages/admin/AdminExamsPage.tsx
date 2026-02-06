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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight mb-1">Editor de Exames</h1>
          <p className="text-sm text-gray-500 font-medium">Gerencie e publique exames oficiais das universidades.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/admin/exams/bulk-import')}
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-3 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Upload size={16} className="text-green-500" />
            Importação em Massa
          </button>
          <button
            onClick={() => navigate('/admin/exams/create')}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            <Plus size={18} />
            Novo Exame
          </button>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total de Exames', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Exames Ativos', value: stats.active, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Disciplinas Atendidas', value: stats.disciplines, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((s, i) => (
          <div key={i} className={clsx("p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3", s.bg)}>
            <div className={clsx("p-2 rounded-xl bg-white shadow-sm", s.color)}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest leading-none mb-1">{s.label}</p>
              <p className="text-xl font-black text-gray-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="flex-1 relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
          <input
            type="text"
            placeholder="Pesquisar por nome do exame..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            <select
              value={selectedUniversity}
              onChange={(e) => {
                setSelectedUniversity(e.target.value);
                setSelectedDiscipline('all');
              }}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold appearance-none"
            >
              <option value="all">Todas Universidades</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>{u.shortName}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 md:w-48">
            <GraduationCap className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold appearance-none"
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Exame / Disciplina</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Instituição</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ano</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 font-bold text-sm">Nenhum exame encontrado</td>
                </tr>
              ) : (
                filteredExams.map((exam) => {
                  const discipline = disciplines.find(d => d.id === exam.disciplineId);
                  const university = universities.find(u => u.id === exam.universityId);
                  return (
                    <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-800 group-hover:text-primary transition-colors">{exam.name}</span>
                          <span className="text-xs text-gray-400 font-medium">{discipline?.title || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase">
                          {university?.shortName || exam.universityId}
                        </span>
                      </td>
                      <td className="p-3 text-center text-gray-600 font-black text-sm">
                        {exam.year}
                      </td>
                      <td className="p-3 flex justify-center items-center">
                        <div className={clsx(
                          "w-2 h-2 rounded-full",
                          exam.isActive ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" : "bg-gray-300"
                        )} />
                      </td>
                      <td className="p-3 text-right">
                         <div className="flex justify-end gap-1 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => navigate(`/admin/exams/${exam.id}/edit`)} className="p-1.5 hover:text-primary hover:bg-gray-100 rounded-lg transition-all" title="Editar"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteClick(exam.id)} className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Excluir"><Trash2 size={16} /></button>
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
