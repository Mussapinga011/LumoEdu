import { useState, useEffect } from 'react';
import { getAllUsers, updateUserProfile, deleteUser } from '../../services/dbService.supabase';
import { UserProfile } from '../../types/user';
import { Search, Edit, X, Trash2, Shield, User } from 'lucide-react';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';
import clsx from 'clsx';

interface EditingUser {
  id: string;
  displayName: string;
  email: string;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'admins'>('users');
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const { modalState, showConfirm, closeModal } = useModal();
  const { toastState, showSuccess, showError, showWarning, closeToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser({
      id: user.id || user.uid,
      displayName: user.displayName,
      email: user.email
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (!editingUser.displayName) {
      showWarning('Nome é obrigatório');
      return;
    }

    try {
      const updates = {
        display_name: editingUser.displayName
      };
      
      await updateUserProfile(editingUser.id, updates);
      
      setUsers(users.map(u => 
        (u.id === editingUser.id || u.uid === editingUser.id)
          ? { ...u, displayName: editingUser.displayName } 
          : u
      ));
      showSuccess('Usuário atualizado com sucesso no Supabase!');
      setEditingUser(null);
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    showConfirm(
      'Excluir Perfil',
      'Deseja remover este perfil do banco de dados do Supabase?',
      async () => {
        try {
           await deleteUser(userId);
           setUsers(users.filter(u => u.id !== userId && u.uid !== userId));
           showSuccess('Perfil removido com sucesso!');
        } catch (error) {
           showError('Erro ao excluir: ' + getErrorMessage(error));
        }
      }
    );
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    showConfirm(
      'Alterar Cargo',
      `Mudar usuário para ${newRole === 'admin' ? 'Administrador' : 'Estudante'}?`,
      async () => {
        try {
          await updateUserProfile(userId, { role: newRole });
          setUsers(users.map(u => (u.id === userId || u.uid === userId) ? { ...u, role: newRole } : u));
          showSuccess(`Permissões de ${newRole} concedidas!`);
        } catch (error) {
          showError(getErrorMessage(error));
        }
      }
    );
  };

  const handlePremiumToggle = async (userId: string, currentPremium: boolean) => {
    const action = currentPremium ? 'REMOVER' : 'CONCEDER';
    showConfirm(
      'Status Premium',
      `Deseja ${action} o plano Premium para este usuário?`,
      async () => {
        try {
          await updateUserProfile(userId, { is_premium: !currentPremium });
          setUsers(users.map(u => (u.id === userId || u.uid === userId) ? { ...u, isPremium: !currentPremium } : u));
          showSuccess(`Premium ${currentPremium ? 'removido' : 'ativado'}!`);
        } catch (error) {
          showError(getErrorMessage(error));
        }
      }
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'admins' ? user.role === 'admin' : user.role !== 'admin';
    return matchesSearch && matchesTab;
  });

  if (loading) return <div className="p-20 text-center font-black text-primary animate-pulse uppercase tracking-widest">Acessando Arquivos...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter uppercase">Usuários</h1>
          <p className="text-gray-400 font-medium">Gestão de {users.length} membros da LumoEdu.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
          <input
            type="text"
            placeholder="Pesquisar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary focus:bg-white outline-none font-bold transition-all"
          />
        </div>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'users', label: 'Estudantes', icon: User },
          { id: 'admins', label: 'Admins', icon: Shield }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              "flex items-center gap-2 px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all",
              activeTab === tab.id ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-6 text-left font-black text-gray-400 uppercase text-[10px] tracking-widest">Identidade</th>
              <th className="p-6 text-left font-black text-gray-400 uppercase text-[10px] tracking-widest">Plano</th>
              <th className="p-6 text-left font-black text-gray-400 uppercase text-[10px] tracking-widest">Atividade</th>
              <th className="p-6 text-right font-black text-gray-400 uppercase text-[10px] tracking-widest">Ações Rápidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map((u) => {
              const userId = u.id || u.uid;
              return (
                <tr key={userId} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner", u.role === 'admin' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600")}>
                        {u.photoURL ? <img src={u.photoURL} className="w-full h-full rounded-2xl object-cover" /> : u.displayName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-gray-800 text-lg uppercase tracking-tighter leading-none">{u.displayName}</div>
                        <div className="text-sm text-gray-400 font-medium lowercase tracking-tight">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <button onClick={() => handlePremiumToggle(userId, u.isPremium)} className={clsx("px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-2", u.isPremium ? "bg-yellow-50 text-yellow-600 border-yellow-100" : "bg-gray-50 text-gray-400 border-gray-100 hover:border-yellow-200")}>
                      {u.isPremium ? '🌟 Premium' : '⚪ Free'}
                    </button>
                  </td>
                  <td className="p-6">
                    <div className="text-xs font-black text-gray-700 uppercase">{u.dailyExercisesCount || 0} resolvidos</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Questões no total</div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditUser(u)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit size={18} /></button>
                      <button onClick={() => handleRoleChange(userId, u.role === 'admin' ? 'user' : 'admin')} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-purple-600 hover:text-white transition-all"><Shield size={18} /></button>
                      <button onClick={() => handleDeleteUser(userId)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Ajustar Perfil</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-400"><X size={28} /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome de Exibição</label>
                <input type="text" value={editingUser.displayName} onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary focus:bg-white outline-none font-bold" />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button onClick={() => setEditingUser(null)} className="flex-1 font-black text-gray-400 uppercase">Cancelar</button>
                <button onClick={handleSaveEdit} className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 active:translate-y-1">SALVAR 💾</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} />
      {toastState.isOpen && <Toast message={toastState.message} type={toastState.type} onClose={closeToast} />}
    </div>
  );
};

export default AdminUsersPage;
