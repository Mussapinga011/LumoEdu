import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { getVideoLessons } from '../services/dbService';
import { VideoLesson } from '../types/video';
import { Lock, Filter, ChevronDown } from 'lucide-react';
import { getYoutubeThumbnail } from '../lib/youtubeUtils';
import clsx from 'clsx';

const VideoLessonsPage = () => {
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [subject, setSubject] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchVideos = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const result = await getVideoLessons(
        reset ? null : lastDoc, 
        20, 
        { subject: subject || undefined }
      );
      
      if (reset) {
        setVideos(result.videos);
        if (result.videos.length > 0 && !selectedVideo) {
          // Select first video if none selected
          setSelectedVideo(result.videos[0]);
        }
      } else {
        setVideos(prev => [...prev, ...result.videos]);
      }
      
      setLastDoc(result.lastDoc);
      setHasMore(result.videos.length === 20);
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      // Alert user if it's likely an index issue
      if (error?.message?.includes('index')) {
        alert("Erro de Configuração: É necessário criar um índice no Firestore. Verifique o console do navegador para o link.");
      }
    } finally {
      setLoading(false);
    }
  }, [lastDoc, subject, selectedVideo]);

  useEffect(() => {
    fetchVideos(true);
  }, [subject]);

  const isPremium = user?.isPremium || user?.role === 'admin';
  const isDataSaver = user?.dataSaverMode;

  const handleVideoSelect = (video: VideoLesson, index: number) => {
    // Freemium Logic:
    // Index 0 (First video) is ALWAYS free.
    // Others are locked for non-premium.
    if (!isPremium && index !== 0) {
      return; // Locked
    }
    setSelectedVideo(video);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Videoaulas</h1>
          <p className="text-gray-600">Aprenda com nossos professores especialistas</p>
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 md:hidden"
        >
          <Filter size={18} />
          Filtros
          <ChevronDown size={16} className={clsx("transition-transform", showFilters ? "rotate-180" : "")} />
        </button>

        <div className={clsx(
          "flex flex-col md:flex-row gap-3 md:flex",
          showFilters ? "flex" : "hidden"
        )}>
          <select 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Todas as Disciplinas</option>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player Section */}
        <div className="lg:col-span-2 space-y-6">
          {selectedVideo ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-4 z-10">
              <div className="aspect-video bg-black relative">
                {(!isPremium && videos.indexOf(selectedVideo) !== 0) ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                     <Lock size={48} className="mb-4 text-yellow-400" />
                     <h3 className="text-xl font-bold mb-2">Conteúdo Premium</h3>
                     <p className="mb-6 opacity-80">Atualize sua conta para assistir a esta aula e ter acesso a todo o conteúdo.</p>
                     <button className="bg-yellow-500 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-400 transition-colors">
                       Seja Premium
                     </button>
                   </div>
                ) : (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?enablejsapi=1`}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  ></iframe>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{selectedVideo.title}</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium">
                        {selectedVideo.subject}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium capitalize">
                        {selectedVideo.videoType === 'theory' ? 'Teoria' : 'Exercício'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="prose max-w-none text-gray-600 text-sm md:text-base">
                  <p>{selectedVideo.description}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <p className="text-gray-500">Selecione uma aula para assistir.</p>
            </div>
          )}
        </div>

        {/* Playlist Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-gray-800 mb-4 px-2">Lista de Aulas</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {videos.map((video, index) => {
                const isLocked = !isPremium && index !== 0;
                const isActive = selectedVideo?.id === video.id;
                
                return (
                  <button
                    key={video.id}
                    onClick={() => handleVideoSelect(video, index)}
                    className={clsx(
                      "w-full text-left p-3 rounded-xl transition-all flex gap-3 group relative",
                      isActive
                        ? "bg-blue-50 border-blue-200 border shadow-sm"
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                  >
                    <div className="w-28 aspect-video bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
                      <img 
                        src={getYoutubeThumbnail(video.youtubeId, isDataSaver ? 'mq' : 'hq')} 
                        alt="" 
                        className={clsx(
                          "w-full h-full object-cover transition-opacity",
                          isLocked ? "grayscale opacity-50" : ""
                        )}
                        loading="lazy"
                      />
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Lock size={16} className="text-white drop-shadow-md" />
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 bg-blue-900/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className={clsx(
                        "font-medium text-sm line-clamp-2 mb-1",
                        isActive ? "text-blue-700" : "text-gray-700"
                      )}>
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{video.subject}</span>
                        <span>•</span>
                        <span className="capitalize">{video.videoType === 'theory' ? 'Teoria' : 'Exercício'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
              
              {hasMore && (
                <button 
                  onClick={() => fetchVideos(false)}
                  disabled={loading}
                  className="w-full py-3 text-center text-blue-600 font-medium text-sm hover:bg-blue-50 rounded-lg transition-colors mt-2"
                >
                  {loading ? 'Carregando...' : 'Carregar mais aulas'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoLessonsPage;
