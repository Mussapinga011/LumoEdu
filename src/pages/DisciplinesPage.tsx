import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '../stores/useContentStore';
import { useAuthStore } from '../stores/useAuthStore';
import { ArrowRight } from 'lucide-react';
import clsx from 'clsx';

const DisciplinesPage = () => {
  const { disciplines, universities, fetchContent, loading } = useContentStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    // Set first university as default when loaded
    if (universities.length > 0 && !selectedUniversityId) {
      setSelectedUniversityId(universities[0].id);
    }
  }, [universities, selectedUniversityId]);

  if (loading && disciplines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedUniversity = universities.find(u => u.id === selectedUniversityId);
  const filteredDisciplines = disciplines.filter(d => d.universityId === selectedUniversityId);

  const DisciplineCard = ({ discipline }: { discipline: any }) => (
    <button 
      onClick={() => navigate(`/disciplines/${discipline.id}/exams`)}
      className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:border-secondary hover:shadow-xl transition-all text-left group"
    >
      <div className={clsx("h-32 flex items-center justify-center text-5xl transition-transform group-hover:scale-110", discipline.color)}>
        {discipline.icon}
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{discipline.title}</h2>
        <p className="text-gray-500 text-sm mb-4">
          Aceda a exames anteriores e questões de prática para {discipline.title}.
        </p>
        <div className="flex items-center text-secondary font-bold text-sm uppercase tracking-wide">
          Ver Exames <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Escolha uma Disciplina</h1>
        
        {/* Dynamic University Tabs */}
        {universities.length > 0 && (
          <div className="bg-gray-100 p-1 rounded-xl inline-flex flex-wrap gap-1">
            {universities.map((uni) => (
              <button
                key={uni.id}
                onClick={() => setSelectedUniversityId(uni.id)}
                className={clsx(
                  "px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                  selectedUniversityId === uni.id 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {uni.shortName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Premium Feature Banner for Free Users */}
      {user && !user.isPremium && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-yellow-800 mb-1">
                ⭐ Modo Aprender - Exclusivo Premium
              </h3>
              <p className="text-sm text-yellow-700">
                Atualize para Premium para ter acesso ilimitado ao modo de estudo com explicações detalhadas!
              </p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition-colors text-sm whitespace-nowrap"
            >
              ⭐ Atualizar
            </button>
          </div>
        </div>
      )}

      <div>
        {selectedUniversity && (
          <h2 className="text-xl font-bold text-gray-700 mb-6">
            {selectedUniversity.name}
          </h2>
        )}
        
        {filteredDisciplines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDisciplines.map((discipline) => (
              <DisciplineCard key={discipline.id} discipline={discipline} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">
              {universities.length === 0 
                ? "Nenhuma universidade cadastrada. Vá ao painel admin para configurar."
                : "Nenhuma disciplina encontrada para esta universidade."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisciplinesPage;

