import { useState, useEffect } from 'react';
import { getAllDownloads, incrementDownloadCount } from '../services/dbService';
import { DownloadMaterial } from '../types/download';
import { useAuthStore } from '../stores/useAuthStore';
import { useContentStore } from '../stores/useContentStore';
import { 
  FileText, 
  Search, 
  Download, 
  Lock, 
  Filter, 
  GraduationCap, 
  Calendar,
  BookOpen,
  ArrowRight,
  Info
} from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../hooks/useNotifications';
import Toast from '../components/Toast';

const DownloadsPage = () => {
  const { user } = useAuthStore();
  const { disciplines, universities, fetchContent, loading: contentLoading } = useContentStore();
  const { toastState, showWarning, closeToast } = useToast();

  const [materials, setMaterials] = useState<DownloadMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniId, setSelectedUniId] = useState<string>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchContent();
    fetchData();
  }, [fetchContent]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllDownloads();
      setMaterials(data);
    } catch (error) {
      console.error("Error fetching downloads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (item: DownloadMaterial) => {
    if (item.isPremium && !user?.isPremium) {
      showWarning('Este material é exclusivo para membros Premium! ✨');
      return;
    }

    await incrementDownloadCount(item.id);
    window.open(item.fileUrl, '_blank');
  };

  const filteredMaterials = materials.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUni = selectedUniId === 'all' || item.universityId === selectedUniId;
    const matchesDisc = selectedDiscipline === 'all' || item.disciplineId === selectedDiscipline;
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesUni && matchesDisc && matchesType;
  });

  if (loading || (contentLoading && universities.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 rounded-3xl border border-white/50 backdrop-blur-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Materiais de Estudo</h1>
          <p className="text-gray-600 text-lg">
            Acesse exames de anos anteriores, guias de estudo e resoluções completas para sua preparação.
          </p>
        </div>
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <FileText size={200} />
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="O que você está procurando?"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={() => setSelectedUniId('all')}
              className={clsx(
                "px-6 py-3 rounded-xl font-bold transition-all border-2 whitespace-nowrap",
                selectedUniId === 'all' 
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                  : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
              )}
            >
              Geral
            </button>
            {universities.map(uni => (
              <button 
                key={uni.id}
                onClick={() => setSelectedUniId(uni.id)}
                className={clsx(
                  "px-6 py-3 rounded-xl font-bold transition-all border-2 whitespace-nowrap",
                  selectedUniId === uni.id 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                )}
              >
                {uni.shortName}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-4 flex-1 min-w-[200px]">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
              <BookOpen size={20} />
            </div>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none font-bold text-gray-700"
            >
              <option value="all">Todas Disciplinas</option>
              {disciplines
                .filter(d => selectedUniId === 'all' || d.universityId === selectedUniId)
                .map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 flex-1 min-w-[200px]">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
              <Filter size={20} />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none font-bold text-gray-700"
            >
              <option value="all">Tipo de Material</option>
              <option value="exam">Exames Anteriores</option>
              <option value="guide">Guias de Estudo</option>
              <option value="summary">Resumos</option>
            </select>
          </div>
        </div>
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
            <Search size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Nenhum material encontrado</h3>
          <p className="text-gray-500 max-w-sm">Tente ajustar seus filtros para encontrar o que procura.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-primary/30 transition-all hover:shadow-xl hover:-translate-y-1 group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={clsx(
                  "p-4 rounded-2xl shadow-sm",
                  item.type === 'exam' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                )}>
                  <FileText size={32} />
                </div>
                {item.isPremium && (
                  <span className="bg-yellow-100 text-yellow-700 p-2 rounded-lg" title="Material Premium">
                    <Lock size={16} />
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold uppercase px-2 py-1 rounded-md flex items-center gap-1">
                      <GraduationCap size={12} />
                      {item.universityName || 'Geral'}
                    </span>
                    {item.year && (
                      <span className="bg-gray-100 text-gray-500 text-[10px] font-bold uppercase px-2 py-1 rounded-md flex items-center gap-1">
                        <Calendar size={12} />
                        {item.year}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="text-xs text-gray-400 font-medium">
                    {item.fileSize || 'N/A'} • {item.downloadCount} downloads
                  </div>
                  <button
                    onClick={() => handleDownload(item)}
                    className={clsx(
                      "flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95",
                      item.isPremium && !user?.isPremium
                        ? "bg-gray-100 text-gray-400"
                        : "bg-primary text-white hover:bg-primary-hover shadow-primary/10"
                    )}
                  >
                    {item.isPremium && !user?.isPremium ? (
                      <>
                        <Lock size={16} />
                        Premium
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Baixar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!user?.isPremium && (
        <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden mt-12">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-500 px-4 py-1.5 rounded-full font-bold text-sm">
                ⭐ ACESSO ILIMITADO
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                Turbine seus estudos com materiais Premium exclusivos!
              </h2>
              <p className="text-gray-400 text-lg">
                Tenha acesso a resoluções passo-a-passo, guias de revisão intensiva e todos os exames sem restrições.
              </p>
              <button 
                onClick={() => window.location.href = '/profile'}
                className="bg-white text-gray-900 font-bold py-4 px-8 rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2 group shadow-xl"
              >
                Ser Premium Agora
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur p-6 rounded-2xl border border-white/10 space-y-2">
                <BookOpen className="text-primary" />
                <h4 className="font-bold">Resoluções</h4>
                <p className="text-xs text-gray-500">Explicadas passo-a-passo por tutores.</p>
              </div>
              <div className="bg-white/5 backdrop-blur p-6 rounded-2xl border border-white/10 space-y-2">
                <Filter className="text-secondary" />
                <h4 className="font-bold">Filtros Pro</h4>
                <p className="text-xs text-gray-500">Busca avançada para cada necessidade.</p>
              </div>
              <div className="bg-white/5 backdrop-blur p-6 rounded-2xl border border-white/10 space-y-2">
                <Info className="text-yellow-500" />
                <h4 className="font-bold">Dicas</h4>
                <p className="text-xs text-gray-500">Estratégias para cada universidade.</p>
              </div>
              <div className="bg-white/5 backdrop-blur p-6 rounded-2xl border border-white/10 space-y-2">
                <Download className="text-green-500" />
                <h4 className="font-bold">Offline</h4>
                <p className="text-xs text-gray-500">Baixe tudo para estudar sem internet.</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />
        </div>
      )}

      {toastState.isOpen && <Toast {...toastState} onClose={closeToast} />}
    </div>
  );
};

export default DownloadsPage;
