import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDisciplines, updateDiscipline } from '../../services/dbService';
import { Discipline } from '../../types/discipline';
import { BookOpen, ChevronRight, Search, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../hooks/useNotifications';
import Toast from '../../components/Toast';
import clsx from 'clsx';

const AdminLearningPage = () => {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toastState, showSuccess, showError, closeToast } = useToast();

  useEffect(() => {
    fetchDisciplines();
  }, []);

  const fetchDisciplines = async () => {
    setLoading(true);
    try {
      const data = await getAllDisciplines();
      // No admin, queremos ver todos, mas agrupados por título para organização
      // No entanto, se quisermos habilitar/desabilitar individualmente, talvez não devêssemos agrupar
      // Vamos agrupar mas manter a referência para podermos alternar
      const uniqueDisciplines = data.reduce((acc: Discipline[], current) => {
        if (!acc.find(item => item.title === current.title)) {
          acc.push(current);
        }
        return acc;
      }, []);
      setDisciplines(uniqueDisciplines);
    } catch (error) {
      console.error('Error fetching disciplines:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (discipline: Discipline, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita navegar ao clicar no toggle
    try {
      const newStatus = !discipline.isActive;
      await updateDiscipline(discipline.id, { isActive: newStatus });
      
      setDisciplines(prev => prev.map(d => 
        d.id === discipline.id ? { ...d, isActive: newStatus } : d
      ));
      
      showSuccess(`Disciplina ${newStatus ? 'ativada' : 'inibida'} com sucesso!`);
    } catch (error) {
      showError('Erro ao atualizar status');
    }
  };

  const filteredDisciplines = disciplines.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest">Carregando conteúdos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Gestão de Disciplinas</h1>
          <p className="text-gray-500 font-medium">Ative ou iniba cursos para os alunos</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDisciplines.map((discipline) => (
          <div
            key={discipline.id}
            onClick={() => navigate(`/admin/learning/${discipline.id}/sessions`)}
            className={clsx(
              "bg-white rounded-3xl border-2 transition-all cursor-pointer group overflow-hidden relative",
              discipline.isActive ? "border-gray-100 hover:border-primary hover:shadow-xl" : "border-gray-200 opacity-75 grayscale bg-gray-50"
            )}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm", discipline.color)}>
                    {discipline.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tight">{discipline.title}</h3>
                    <span className={clsx(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                      discipline.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {discipline.isActive ? 'Ativo' : 'Inibido'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => toggleStatus(discipline, e)}
                  className={clsx(
                    "p-2 rounded-xl transition-all shadow-sm",
                    discipline.isActive ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-500 hover:bg-green-100"
                  )}
                  title={discipline.isActive ? 'Inibir' : 'Ativar'}
                >
                  {discipline.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div className="flex items-center justify-between text-gray-400 group-hover:text-primary transition-colors mt-4">
                <span className="text-sm font-bold uppercase tracking-wide">Editar Sessões</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDisciplines.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma disciplina encontrada.</p>
        </div>
      )}

      {toastState.isOpen && <Toast {...toastState} onClose={closeToast} />}
    </div>
  );
};

export default AdminLearningPage;
