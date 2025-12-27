import { useState, useEffect } from 'react';
import { Trophy, Medal, User, X } from 'lucide-react';
import { getAllUsers } from '../services/dbService';
import { UserProfile } from '../types/user';
import clsx from 'clsx';
import { useContentStore } from '../stores/useContentStore';

const RankingPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('all');
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { disciplines, universities, fetchContent } = useContentStore();

  useEffect(() => {
    fetchContent();
    fetchRanking();
  }, [fetchContent]);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScore = (user: UserProfile) => {
    if (selectedDisciplineId === 'all') return user.score || 0;
    return user.disciplineScores?.[selectedDisciplineId] || 0;
  };

  // Filter disciplines by university
  const filteredDisciplines = selectedUniversityId === 'all' 
    ? disciplines 
    : disciplines.filter(d => d.universityId === selectedUniversityId);

  const sortedUsers = [...users]
    .sort((a, b) => getScore(b) - getScore(a))
    .slice(0, 50);

  const currentUniversity = universities.find(u => u.id === selectedUniversityId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 pb-8">
      {/* University Filter Sidebar (Desktop) / Tabs (Mobile) */}
      <div className="md:w-64 shrink-0">
        <div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-gray-100 sticky top-4">
          <h3 className="font-bold text-gray-800 mb-4">Universidade</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setSelectedUniversityId('all');
                setSelectedDisciplineId('all');
              }}
              className={clsx(
                "w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2",
                selectedUniversityId === 'all'
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              )}
            >
              🌍 Todas
            </button>
            {universities.map((uni) => (
              <button
                key={uni.id}
                onClick={() => {
                  setSelectedUniversityId(uni.id);
                  setSelectedDisciplineId('all');
                }}
                className={clsx(
                  "w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2",
                  selectedUniversityId === uni.id
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                )}
              >
                🎓 {uni.shortName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header with Discipline Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-800">Ranking Nacional</h1>
            <p className="text-gray-500">
              {currentUniversity ? currentUniversity.name : 'Todas as Universidades'}
            </p>
          </div>
          
          <select
            value={selectedDisciplineId}
            onChange={(e) => setSelectedDisciplineId(e.target.value)}
            className="w-full md:w-auto p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px] font-medium text-gray-700 bg-white"
          >
            <option value="all">Geral (Desafios)</option>
            {filteredDisciplines.map(d => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </div>

        {/* Ranking Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100">
          <div className="p-4 bg-secondary/10 border-b border-gray-100 flex items-center justify-between font-bold text-gray-500 uppercase text-xs md:text-sm tracking-wide">
            <div className="w-8 md:w-12 text-center">#</div>
            <div className="flex-1">Estudante</div>
            <div className="w-24 md:w-32 text-center">Ações</div>
            <div className="w-20 md:w-32 text-right">Pontos</div>
          </div>

          <div className="divide-y divide-gray-100">
            {sortedUsers.length === 0 || sortedUsers.every(u => getScore(u) === 0) ? (
              <div className="p-8 text-center text-gray-500">
                Sem pontuações ainda. Seja o primeiro!
              </div>
            ) : (
              sortedUsers.map((student, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const score = getScore(student);
                
                if (score === 0) return null;
                
                return (
                  <div 
                    key={student.uid} 
                    className={clsx(
                      "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors",
                      isTop3 && "bg-yellow-50/50"
                    )}
                  >
                    <div className="w-12 text-center font-bold text-lg flex justify-center">
                      {rank === 1 ? <Trophy className="text-yellow-500" /> :
                       rank === 2 ? <Medal className="text-gray-400" /> :
                       rank === 3 ? <Medal className="text-orange-500" /> :
                       <span className="text-gray-500">{rank}</span>}
                    </div>
                    
                    <div className="flex-1 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={clsx("font-bold", isTop3 ? "text-gray-800" : "text-gray-600")}>
                            {student.displayName}
                          </span>
                          {student.isPremium && <span className="text-yellow-600">⭐</span>}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedDisciplineId === 'all' 
                            ? `${student.challengesCompleted || 0} desafios`
                            : 'Pontuação da Disciplina'}
                        </div>
                      </div>
                    </div>

                    <div className="w-24 md:w-32 text-center">
                      <button
                        onClick={() => setSelectedUser(student)}
                        className="text-xs md:text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                      >
                        Ver perfil
                      </button>
                    </div>
                    
                    <div className="w-20 md:w-32 text-right">
                      <div className="font-bold text-primary text-base md:text-lg">
                        {score}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-800">Perfil do Estudante</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mx-auto">
                <User size={40} />
              </div>
              <div>
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold text-gray-800">{selectedUser.displayName}</h3>
                  {selectedUser.isPremium && <span className="text-2xl">⭐</span>}
                </div>
                <p className="text-gray-500 text-sm">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedUser.level || 1}</div>
                <div className="text-xs text-gray-500 font-bold uppercase">Nível</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-purple-600">{selectedUser.xp || 0}</div>
                <div className="text-xs text-gray-500 font-bold uppercase">XP Total</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-green-600">{selectedUser.streak || 0}</div>
                <div className="text-xs text-gray-500 font-bold uppercase">Sequência</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-orange-600">{selectedUser.score || 0}</div>
                <div className="text-xs text-gray-500 font-bold uppercase">Pontos</div>
              </div>
            </div>

            {selectedUser.badges && selectedUser.badges.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-700 mb-3">Conquistas</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.badges.map((badge, idx) => (
                    <span key={idx} className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg text-sm font-medium border border-yellow-200">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingPage;
