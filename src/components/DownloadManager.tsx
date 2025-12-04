import { useState, useEffect } from 'react';
import { Download, Trash2, HardDrive } from 'lucide-react';
import { getDownloadedExams, removeOfflineExam, getStorageStats } from '../services/offlineService';

const DownloadManager = () => {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [stats, setStats] = useState({ examCount: 0, estimatedSize: 0, lastSync: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const exams = await getDownloadedExams();
      const storageStats = await getStorageStats();
      setDownloads(exams);
      setStats(storageStats);
    } catch (error) {
      console.error('Error loading downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemove = async (examId: string) => {
    if (!confirm('Remover este exame do armazenamento offline?')) return;
    
    try {
      await removeOfflineExam(examId);
      await loadData();
    } catch (error) {
      console.error('Error removing exam:', error);
      alert('Erro ao remover exame');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-MZ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Gerenciar Downloads</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Download size={18} className="text-blue-600" />
                <span className="text-sm text-gray-600">Exames Baixados</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.examCount}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive size={18} className="text-green-600" />
                <span className="text-sm text-gray-600">Espaço Usado</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatBytes(stats.estimatedSize)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Última Sincronização</span>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {stats.lastSync ? formatDate(stats.lastSync) : 'Nunca'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {downloads.length === 0 ? (
            <div className="text-center py-12">
              <Download size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum exame baixado ainda.</p>
              <p className="text-sm text-gray-400 mt-2">
                Baixe exames para estudar offline na página de Estudar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {downloads.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{exam.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{exam.questions.length} questões</span>
                      <span>•</span>
                      <span>Baixado em {formatDate(exam.downloadedAt)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemove(exam.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadManager;
