import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { StudyGroup } from '../types/group';
import { getAllGroups, getUserGroups, joinGroup, createGroup, deleteGroup, countUserCreatedGroups } from '../services/groupService.supabase';
import { Users, Plus, Search, MessageCircle, Trash2, LogIn } from 'lucide-react';
import { useContentStore } from '../stores/useContentStore';
import clsx from 'clsx';

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

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredGroups(availableGroups);
    } else {
      const filtered = availableGroups.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.disciplineName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchTerm, availableGroups]);

  const loadGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userG, availG] = await Promise.all([
        getUserGroups(user.id),
        getAllGroups()
      ]);
      setMyGroups(userG);
      
      const myGroupIds = userG.map(g => g.id);
      const filtered = availG.filter(g => !myGroupIds.includes(g.id));
      setAvailableGroups(filtered);
      setFilteredGroups(filtered);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = (groupId: string, groupName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ groupId, groupName });
  };

  const confirmDelete = async () => {
    if (!user || !deleteConfirm) return;

    try {
      await deleteGroup(deleteConfirm.groupId, user.id, user.role);
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
      // Regra: Estudante só pode criar 1 grupo
      if (user.role !== 'admin') {
        const createdCount = await countUserCreatedGroups(user.id);
        if (createdCount >= 1) {
          throw new Error('Você pode criar apenas um grupo de estudo. Apague o seu grupo atual antes de criar um novo.');
        }
      }

      const discipline = disciplines.find(d => d.id === newGroupDiscipline);
      const disciplineName = discipline ? discipline.title : 'Geral';

      await createGroup(user.id, {
        name: newGroupName,
        description: newGroupDesc,
        discipline_id: newGroupDiscipline || null,
        discipline_name: disciplineName,
        is_private: false
      });

      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupDiscipline('');
      setToast({ message: 'Grupo criado com sucesso!', type: 'success' });
      loadGroups();
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao criar grupo', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    if (joiningGroupId === groupId) return;

    setJoiningGroupId(groupId);
    try {
      await joinGroup(groupId, user.id);
      setToast({ message: 'Você entrou no grupo!', type: 'success' });
      loadGroups();
      navigate(`/groups/${groupId}`);
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao entrar no grupo', type: 'error' });
      setJoiningGroupId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {toast && (
        <div className={clsx(
          "fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-2xl border-l-4 flex items-start gap-3 animate-in slide-in-from-right",
          toast.type === 'error' ? 'bg-white border-red-500' : 
          toast.type === 'warning' ? 'bg-white border-yellow-500' : 
          'bg-white border-green-500'
        )}>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800">
              {toast.type === 'error' ? 'Erro' : toast.type === 'warning' ? 'Atenção' : 'Sucesso'}
            </h3>
            <p className="text-gray-600">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 shrink-0">
            <img src="/lumo_mascot_modo_grupo.png" alt="Lumo Estudando" className="w-full h-full object-contain filter drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Grupos de Estudo</h1>
            <p className="text-gray-500 mt-1">Estude em comunidade e tire suas dúvidas</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (!user?.isPremium && user?.role !== 'admin') {
              setToast({ 
                message: 'Recurso exclusivo para Premium! 🌟', 
                type: 'warning' 
              });
              return;
            }
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:translate-y-1"
        >
          <Plus size={20} />
          Criar Grupo
        </button>
      </div>

      {myGroups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={24} className="text-primary" />
            Meus Grupos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map(group => (
              <div 
                key={group.id} 
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative group cursor-pointer"
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                {(user?.role === 'admin' || group.createdBy === user?.id) && (
                  <button
                    onClick={(e) => handleDeleteGroup(group.id, group.name, e)}
                    className="absolute top-3 right-3 p-2 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                      <MessageCircle size={24} />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{group.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{group.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary font-medium">{group.disciplineName}</span>
                    <span className="text-gray-400 font-bold group-hover:text-primary transition-colors flex items-center gap-1">
                      Acessar <MessageCircle size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Explorar Grupos</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, descrição ou disciplina..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all shadow-sm"
          />
        </div>
        
        {filteredGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 font-medium">Nenhum grupo encontrado com sua busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map(group => (
              <div key={group.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <h3 className="font-bold text-lg text-gray-800 mb-1">{group.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{group.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                    {group.disciplineName}
                  </span>
                  <button 
                    onClick={() => handleJoinGroup(group.id)}
                    disabled={joiningGroupId === group.id}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
                  >
                    {joiningGroupId === group.id ? 'Entrando...' : (
                      <>
                        <LogIn size={16} /> Entrar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-black mb-6 tracking-tighter uppercase text-gray-800">Novo Grupo</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome do Grupo</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none font-bold"
                  placeholder="Ex: Física UEM 2024"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Disciplina</label>
                <select
                  value={newGroupDiscipline}
                  onChange={e => setNewGroupDiscipline(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary outline-none font-bold"
                >
                  <option value="">Geral</option>
                  {disciplines.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Descrição</label>
                <textarea
                  required
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary outline-none h-24 resize-none font-bold"
                  placeholder="Conte um pouco sobre o grupo..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 font-black text-gray-400 uppercase tracking-tighter">Cancelar</button>
                <button type="submit" disabled={creating} className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 active:translate-y-1">
                  {creating ? 'CRIANDO...' : 'CRIAR GRUPO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-10 w-full max-w-sm text-center shadow-2xl border-4 border-red-50 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={40} />
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tighter uppercase">Excluir Grupo?</h2>
            <p className="text-gray-500 font-medium mb-8">
              Ação irreversível. O grupo <span className="text-red-600 font-bold">{deleteConfirm.groupName}</span> será removido para todos.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 font-black text-gray-400 uppercase tracking-tighter">Voltar</button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-200 active:translate-y-1"
              >
                EXCLUIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
