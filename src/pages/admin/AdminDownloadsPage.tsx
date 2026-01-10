import { useState, useEffect } from 'react';
import { 
  getAllDownloads, 
  createDownloadMaterial, 
  updateDownloadMaterial, 
  deleteDownloadMaterial 
} from '../../services/dbService.supabase';
import { DownloadMaterial } from '../../types/download';
import { Plus, Edit, Trash2, Search, Link as LinkIcon, FileText, ExternalLink, X } from 'lucide-react';
import { useContentStore } from '../../stores/useContentStore';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';
import clsx from 'clsx';

const AdminDownloadsPage = () => {
  const [downloads, setDownloads] = useState<DownloadMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { disciplines, universities, fetchContent, loading: contentLoading } = useContentStore();
  const { modalState, showConfirm, closeModal } = useModal();
  const { toastState, showSuccess, showError, closeToast } = useToast();

  const [formData, setFormData] = useState<Omit<DownloadMaterial, 'id' | 'downloadCount' | 'createdAt'>>({
    title: '',
    description: '',
    fileUrl: '',
    fileSize: '',
    type: 'exam',
    disciplineId: '',
    disciplineName: '',
    universityId: 'all',
    universityName: 'Geral',
    year: new Date().getFullYear(),
    isPremium: false
  });

  useEffect(() => {
    fetchData();
    fetchContent();
  }, [fetchContent]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllDownloads();
      setDownloads(data);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      fileUrl: '',
      fileSize: '',
      type: 'exam',
      disciplineId: '',
      disciplineName: '',
      universityId: 'all',
      universityName: 'Geral',
      year: new Date().getFullYear(),
      isPremium: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: DownloadMaterial) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || '',
      fileUrl: item.fileUrl,
      fileSize: item.fileSize || '',
      type: item.type,
      disciplineId: item.disciplineId,
      disciplineName: item.disciplineName,
      universityId: item.universityId,
      universityName: item.universityName || 'Geral',
      year: item.year || new Date().getFullYear(),
      isPremium: item.isPremium
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const discipline = disciplines.find(d => d.id === formData.disciplineId);
    if (!discipline) {
      showError('Selecione uma disciplina válida');
      return;
    }

    const uni = universities.find(u => u.id === formData.universityId);
    const universityName = uni ? uni.shortName : 'Geral';

    const finalData = {
      ...formData,
      disciplineName: discipline.title,
      universityName
    };

    try {
      if (editingId) {
        await updateDownloadMaterial(editingId, finalData);
        showSuccess('Material atualizado no Supabase!');
      } else {
        await createDownloadMaterial(finalData);
        showSuccess('Material cadastrado no Supabase!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleDeleteClick = (id: string) => {
    showConfirm(
      'Excluir Material',
      'Tem certeza que deseja excluir este material de download?',
      async () => {
        try {
          await deleteDownloadMaterial(id);
          showSuccess('Material excluído!');
          fetchData();
        } catch (error) {
          showError(getErrorMessage(error));
        }
      }
    );
  };

  const filteredDownloads = downloads.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.disciplineName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDisciplines = formData.universityId === 'all'
    ? disciplines
    : disciplines.filter(d => d.universityId === formData.universityId);

  if (loading || (contentLoading && universities.length === 0)) return <div className="p-20 text-center font-black animate-pulse text-secondary">CARREGANDO MATERIAIS...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter uppercase leading-none">Downloads</h1>
          <p className="text-gray-400 font-medium">Gestão de provas PDF, guias e resumos.</p>
        </div>
        <button onClick={handleOpenCreateModal} className="flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-black hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 active:translate-y-1">
          <Plus size={20} /> NOVO MATERIAL
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por título, ano ou disciplina..."
          className="w-full pl-16 pr-8 py-5 bg-white border-2 border-gray-50 rounded-3xl focus:border-secondary focus:bg-white outline-none font-bold transition-all shadow-sm"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">Identidade do Arquivo</th>
              <th className="p-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">Categoria</th>
              <th className="p-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">Acesso</th>
              <th className="p-6 text-right font-black text-gray-400 uppercase text-[10px] tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredDownloads.map((item) => (
              <tr key={item.id} className="hover:bg-purple-50/30 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", item.type === 'exam' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600")}>
                      <FileText size={28} />
                    </div>
                    <div>
                      <div className="font-black text-gray-800 text-lg leading-none uppercase tracking-tighter">{item.title}</div>
                      <div className="text-sm text-gray-400 font-bold uppercase mt-1 tracking-widest text-[10px]">{item.year} • {item.fileSize || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="font-black text-gray-700 uppercase tracking-tighter">{item.disciplineName}</div>
                  <div className="text-[10px] font-black text-secondary uppercase opacity-60 tracking-widest">{item.universityName}</div>
                </td>
                <td className="p-6">
                  <span className={clsx("px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-widest border-2", item.isPremium ? "bg-yellow-50 text-yellow-600 border-yellow-100" : "bg-green-50 text-green-600 border-green-100")}>
                    {item.isPremium ? '⭐ PREMIUM' : '🟢 GRÁTIS'}
                  </span>
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary hover:text-white transition-all"><ExternalLink size={18} /></a>
                    <button onClick={() => handleOpenEditModal(item)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-secondary hover:text-white transition-all"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteClick(item.id)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-3xl font-black tracking-tighter uppercase">{editingId ? 'Editar Manual' : 'Novo Recurso'}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Título</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-bold" placeholder="Ex: Prova de Matemática UEM 2024" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">URL Permanente</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input type="url" required value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} className="w-full pl-12 p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-bold" placeholder="Google Drive Link..." />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Instituição</label>
                <select value={formData.universityId} onChange={e => setFormData({...formData, universityId: e.target.value, disciplineId: ''})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary outline-none font-bold">
                  <option value="all">Foco Geral</option>
                  {universities.map(uni => <option key={uni.id} value={uni.id}>{uni.shortName}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Disciplina</label>
                <select required value={formData.disciplineId} onChange={e => setFormData({...formData, disciplineId: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary outline-none font-bold">
                  <option value="">Selecione...</option>
                  {filteredDisciplines.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ano</label>
                <input type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-secondary outline-none font-bold" />
              </div>

              <div className="flex items-center gap-3 bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                <input type="checkbox" id="isPremium" checked={formData.isPremium} onChange={e => setFormData({...formData, isPremium: e.target.checked})} className="w-6 h-6 rounded-lg text-secondary focus:ring-secondary" />
                <label htmlFor="isPremium" className="font-black text-yellow-700 text-xs uppercase cursor-pointer">Apenas Premium ⭐</label>
              </div>

              <div className="md:col-span-2 flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-black text-gray-400 uppercase">Cancelar</button>
                <button type="submit" className="flex-1 bg-secondary text-white py-4 rounded-2xl font-black shadow-lg shadow-secondary/20 active:translate-y-1 transition-all">
                  {editingId ? 'ATUALIZAR' : 'CADASTRAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} />
      {toastState.isOpen && <Toast {...toastState} onClose={closeToast} />}
    </div>
  );
};

export default AdminDownloadsPage;
