import { useState, useEffect } from 'react';
import { 
  getAllDownloads, 
  createDownloadMaterial, 
  updateDownloadMaterial, 
  deleteDownloadMaterial 
} from '../../services/dbService';
import { DownloadMaterial } from '../../types/download';
import { Plus, Edit, Trash2, Search, Link as LinkIcon, FileText, ExternalLink } from 'lucide-react';
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

  const { disciplines, fetchDisciplines } = useContentStore();
  const { modalState, showConfirm, closeModal } = useModal();
  const { toastState, showSuccess, showError, closeToast } = useToast();

  // Form State
  const [formData, setFormData] = useState<Omit<DownloadMaterial, 'id' | 'downloadCount' | 'createdAt'>>({
    title: '',
    description: '',
    fileUrl: '',
    fileSize: '',
    type: 'exam',
    disciplineId: '',
    disciplineName: '',
    university: 'all',
    year: new Date().getFullYear(),
    isPremium: false
  });

  useEffect(() => {
    fetchData();
    fetchDisciplines();
  }, [fetchDisciplines]);

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
      university: 'all',
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
      university: item.university,
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

    const finalData = {
      ...formData,
      disciplineName: discipline.title
    };

    try {
      if (editingId) {
        await updateDownloadMaterial(editingId, finalData);
        showSuccess('Material atualizado com sucesso!');
      } else {
        await createDownloadMaterial(finalData);
        showSuccess('Material cadastrado com sucesso!');
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

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Downloads</h1>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors"
        >
          <Plus size={20} />
          Novo Material
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou disciplina..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Material</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Disciplina/Uni</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Downloads</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredDownloads.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "p-2 rounded-lg",
                      item.type === 'exam' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                    )}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.year} • {item.fileSize || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-700">{item.disciplineName}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold">{item.university}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "px-2 py-1 rounded-full text-xs font-bold",
                    item.isPremium 
                      ? "bg-yellow-100 text-yellow-700" 
                      : "bg-green-100 text-green-700"
                  )}>
                    {item.isPremium ? '⭐ PREMIUM' : 'GRÁTIS'}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-600">
                  {item.downloadCount}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <a 
                      href={item.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-primary"
                      title="Ver Link Externo"
                    >
                      <ExternalLink size={18} />
                    </a>
                    <button 
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 text-gray-400 hover:text-secondary"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(item.id)}
                      className="p-2 text-gray-400 hover:text-danger"
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

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? 'Editar Material' : 'Cadastrar Novo Material'}
            </h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Título do Material</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Exame de Matemática UEM 2024"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Link do Arquivo (Google Drive, etc.)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="url"
                    required
                    value={formData.fileUrl}
                    onChange={e => setFormData({...formData, fileUrl: e.target.value})}
                    className="w-full pl-10 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Disciplina</label>
                <select
                  required
                  value={formData.disciplineId}
                  onChange={e => setFormData({...formData, disciplineId: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione...</option>
                  {disciplines.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Universidade</label>
                <select
                  value={formData.university}
                  onChange={e => setFormData({...formData, university: e.target.value as any})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">Todas</option>
                  <option value="UEM">UEM</option>
                  <option value="UP">UP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="exam">Exame Anterior</option>
                  <option value="guide">Guia de Estudo</option>
                  <option value="summary">Resumo</option>
                  <option value="other">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ano</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tamanho (Ex: 2.1 MB)</label>
                <input
                  type="text"
                  value={formData.fileSize}
                  onChange={e => setFormData({...formData, fileSize: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPremium"
                  checked={formData.isPremium}
                  onChange={e => setFormData({...formData, isPremium: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isPremium" className="text-sm font-bold text-gray-700">Apenas para Premium ⭐</label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 h-24 resize-none"
                  placeholder="Mais detalhes sobre o conteúdo..."
                />
              </div>

              <div className="md:col-span-2 flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalState.isOpen && (
        <Modal 
          {...modalState} 
          onClose={closeModal} 
          onConfirm={async () => {
            await modalState.onConfirm?.();
            closeModal();
          }} 
        />
      )}
      
      {toastState.isOpen && <Toast {...toastState} onClose={closeToast} />}
    </div>
  );
};

export default AdminDownloadsPage;
