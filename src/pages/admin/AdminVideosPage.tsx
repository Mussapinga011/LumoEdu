import React, { useEffect, useState } from 'react';
import { createVideoLesson, deleteVideoLesson, getVideoLessons, updateVideoLesson } from '../../services/dbService';
import { VideoLesson } from '../../types/video';
import { Plus, Trash2, RefreshCw, Edit, X } from 'lucide-react';
import { extractYoutubeId, getYoutubeThumbnail } from '../../lib/youtubeUtils';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';
import clsx from 'clsx';

const AdminVideosPage = () => {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { modalState, showConfirm, closeModal } = useModal();
  const { toastState, showSuccess, showError, closeToast } = useToast();
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [subject, setSubject] = useState('Matemática');
  const [videoType, setVideoType] = useState<'theory' | 'exercise'>('theory');
  const [order, setOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Preview State
  const [previewId, setPreviewId] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      const result = await getVideoLessons(null, 50); // Load more for admin
      setVideos(result.videos);
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      if (error?.message?.includes('index')) {
        alert("Erro de Configuração: É necessário criar um índice no Firestore. Verifique o console do navegador para o link.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    const id = extractYoutubeId(youtubeUrl);
    setPreviewId(id);
  }, [youtubeUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !youtubeUrl || !previewId) return;

    setIsCreating(true);
    try {
      // Note: thumbnail is generated in dbService now, but we show preview here
      
      if (editingId) {
        await updateVideoLesson(editingId, {
          title,
          description,
          youtubeUrl,
          subject,
          videoType,
          order
        });
        showSuccess('Aula atualizada com sucesso!');
      } else {
        await createVideoLesson({
          title,
          description,
          youtubeUrl,
          subject,
          videoType,
          order
        });
        showSuccess('Aula adicionada com sucesso!');
      }
      
      handleCancelEdit(); // Reset form
      
      // Refresh list
      await fetchVideos();
      
    } catch (error) {
      console.error("Error creating/updating video:", error);
      showError(getErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (video: VideoLesson) => {
    setEditingId(video.id);
    setTitle(video.title);
    setDescription(video.description);
    setYoutubeUrl(video.youtubeUrl);
    setSubject(video.subject);
    setVideoType(video.videoType);
    setOrder(video.order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setYoutubeUrl('');
    setOrder(prev => editingId ? videos.length + 1 : prev); // Reset order logic slightly simplistic but fine
    setSubject('Matemática');
    setVideoType('theory');
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      'Excluir Aula',
      'Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.',
      async () => {
        try {
          await deleteVideoLesson(id);
          setVideos(videos.filter(v => v.id !== id));
          showSuccess('Aula excluída com sucesso!');
        } catch (error) {
          console.error("Error deleting video:", error);
          showError(getErrorMessage(error));
        }
      },
      'Excluir',
      'Cancelar'
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Aulas</h1>
        <p className="text-gray-600">Adicione e remova videoaulas da plataforma</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                {editingId ? <Edit size={20} /> : <Plus size={20} />}
                {editingId ? 'Editar Aula' : 'Adicionar Nova Aula'}
              </span>
              {editingId && (
                <button 
                  onClick={handleCancelEdit}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <X size={14} /> Cancelar
                </button>
              )}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Introdução à Álgebra"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link do YouTube</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                {previewId && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={getYoutubeThumbnail(previewId, 'mq')} 
                      alt="Preview" 
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Matemática">Matemática</option>
                    <option value="Física">Física</option>
                    <option value="Química">Química</option>
                    <option value="Biologia">Biologia</option>
                    <option value="Português">Português</option>
                    <option value="História">História</option>
                    <option value="Geografia">Geografia</option>
                    <option value="Desenho">Desenho</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="theory">Teoria</option>
                  <option value="exercise">Exercício</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  placeholder="Descrição do conteúdo..."
                />
              </div>

              <button
                type="submit"
                disabled={isCreating || !previewId}
                className={clsx(
                  "w-full text-white py-2 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
                  editingId ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isCreating ? <RefreshCw className="animate-spin" size={20} /> : (editingId ? <Edit size={20} /> : <Plus size={20} />)}
                {isCreating ? (editingId ? 'Atualizando...' : 'Adicionando...') : (editingId ? 'Atualizar Aula' : 'Adicionar Aula')}
              </button>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Aulas Cadastradas ({videos.length})</h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : videos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhuma aula cadastrada ainda.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {videos.map((video) => (
                  <div key={video.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-4">
                    <div className="w-32 aspect-video bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative group">
                      <img 
                        src={getYoutubeThumbnail(video.youtubeId, 'mq')} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded">
                        #{video.order}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 truncate">{video.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{video.subject}</span>
                        <span className="capitalize bg-gray-100 px-1.5 py-0.5 rounded">{video.videoType === 'theory' ? 'Teoria' : 'Exercício'}</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{video.description}</p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEdit(video)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar aula"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir aula"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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

export default AdminVideosPage;
