import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { StudyGroup } from '../types/group';
import { getAvailableGroups, getUserGroups, joinGroup, createGroup, deleteGroup } from '../services/groupService';
import { Users, Plus, Search, MessageCircle, LogIn, Trash2 } from 'lucide-react';
import { useContentStore } from '../stores/useContentStore';

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { disciplines, fetchContent } = useContentStore();

  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [availableGroups, setAvailableGroups] = useState<StudyGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ groupId: string; groupName: string } | null>(null);

  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupDiscipline, setNewGroupDiscipline] = useState('');
  const [creating, setCreating] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
    fetchContent();
  }, [user, fetchContent]);

  // Limpar toast após 4 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filtrar grupos baseado na busca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredGroups(availableGroups);
    } else {
      const filtered = availableGroups.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.disciplineName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchTerm, availableGroups]);

  const loadGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userG, availG] = await Promise.all([
        getUserGroups(user.uid),
        getAvailableGroups()
      ]);
      setMyGroups(userG);
      // Filtrar grupos que o usuário já participa da lista de disponíveis
      const filtered = availG.filter(g => !g.members?.includes(user.uid));
      setAvailableGroups(filtered);
      setFilteredGroups(filtered);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ groupId, groupName });
  };

  const confirmDelete = async () => {
    if (!user || !deleteConfirm) return;

    try {
      await deleteGroup(deleteConfirm.groupId, user.uid, user.role);
      setToast({ message: 'Grupo deletado com sucesso!', type: 'success' });
      loadGroups();
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao deletar grupo', type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!user.isPremium && user.role !== 'admin') {
      setToast({ message: 'Apenas usuários Premium podem criar grupos. Faça upgrade agora!', type: 'warning' });
      return;
    }

    setCreating(true);
    try {
      const discipline = disciplines.find(d => d.id === newGroupDiscipline);
      const disciplineName = discipline ? discipline.title : 'Geral';

      await createGroup(user, {
        name: newGroupName,
        description: newGroupDesc,
        disciplineId: newGroupDiscipline || 'all',
        disciplineName,
        isPrivate: false
      });

      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setToast({ message: 'Grupo criado com sucesso!', type: 'success' });
      loadGroups(); // Recarregar
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao criar grupo', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    if (joiningGroupId === groupId) return; // Prevent double clicks logic

    setJoiningGroupId(groupId);
    try {
      await joinGroup(groupId, user);
      setToast({ message: 'Você entrou no grupo!', type: 'success' });
      loadGroups(); // Recarregar para atualizar listas
      navigate(`/groups/${groupId}`);
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao entrar no grupo', type: 'error' });
      setJoiningGroupId(null); // Clear only on error (on success we navigate away)
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-2xl border-l-4 animate-slide-in flex items-start gap-3 ${
          toast.type === 'error' ? 'bg-white border-red-500' : 
          toast.type === 'warning' ? 'bg-white border-yellow-500' : 
          'bg-white border-green-500'
        }`}>
          <div className={`p-2 rounded-full shrink-0 ${
            toast.type === 'error' ? 'bg-red-100 text-red-600' : 
            toast.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
            'bg-green-100 text-green-600'
          }`}>
            {toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : '✅'}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800">
              {toast.type === 'error' ? 'Erro' : toast.type === 'warning' ? 'Atenção' : 'Sucesso'}
            </h3>
            <p className="text-gray-600">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Grupos de Estudo</h1>
          <p className="text-gray-500 mt-1">Estude em comunidade e tire suas dúvidas</p>
        </div>
        <button
          onClick={() => {
            if (!user?.isPremium && user?.role !== 'admin') {
              setToast({ 
                message: 'Recurso exclusivo para Premium! 🌟\nCrie sua própria comunidade de estudos.', 
                type: 'warning' 
              });
              return;
            }
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-lg"
        >
          <Plus size={20} />
          Criar Grupo
        </button>
      </div>

      {/* Meus Grupos */}
      {myGroups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-primary" />
            Meus Grupos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map(group => (
              <div key={group.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative group">
                {/* Botão deletar (apenas para admin ou criador) */}
                {(user?.role === 'admin' || group.createdBy === user?.uid) && (
                  <button
                    onClick={(e) => handleDeleteGroup(group.id, group.name, e)}
                    className="absolute top-3 right-3 p-2 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    title="Deletar grupo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                
                <div className="cursor-pointer" onClick={() => navigate(`/groups/${group.id}`)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                      <MessageCircle size={24} />
                    </div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {group.membersCount} membros
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{group.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{group.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary font-medium">{group.disciplineName}</span>
                    <button className="text-gray-400 hover:text-primary">
                      Acessar &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grupos Disponíveis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Search size={24} className="text-gray-400" />
            Explorar Grupos
          </h2>
        </div>

        {/* Campo de Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, descrição ou disciplina..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500">
              {searchTerm ? 'Nenhum grupo encontrado com esse termo.' : 'Nenhum grupo novo encontrado.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map(group => (
              <div key={group.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-gray-50 text-gray-600 p-3 rounded-xl">
                    <Users size={24} />
                  </div>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {group.membersCount}/{group.maxMembers}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">{group.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{group.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-bold uppercase text-gray-400">{group.disciplineName}</span>
                  <button 
                    onClick={() => handleJoinGroup(group.id)}
                    disabled={joiningGroupId === group.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      joiningGroupId === group.id 
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {joiningGroupId === group.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Entrando...
                      </>
                    ) : (
                      <>
                        <LogIn size={16} />
                        Entrar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md animate-scale-in shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <Trash2 size={32} className="text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Deletar Grupo?
            </h2>
            
            <p className="text-center text-gray-600 mb-6">
              Tem certeza que deseja deletar o grupo <strong className="text-gray-800">"{deleteConfirm.groupName}"</strong>?
            </p>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ Esta ação não pode ser desfeita. Todas as mensagens e membros serão perdidos permanentemente.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg"
              >
                Sim, Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Grupo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scale-in">
            <h2 className="text-2xl font-bold mb-4">Criar Novo Grupo</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Grupo</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Ex: Feras da Matemática"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Disciplina</label>
                <select
                  value={newGroupDiscipline}
                  onChange={e => setNewGroupDiscipline(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none"
                >
                  <option value="">Geral (Todas)</option>
                  {disciplines.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                <textarea
                  required
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary outline-none h-24 resize-none"
                  placeholder="Qual o objetivo deste grupo?"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
