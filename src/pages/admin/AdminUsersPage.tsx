import { useState, useEffect } from 'react';
import { getAllUsers, updateUserProfile, deleteUser } from '../../services/dbService.supabase';
import { UserProfile } from '../../types/user';
import { Search, Edit, X, Trash2, Shield, User, Sparkles } from 'lucide-react';
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
    const roleName = newRole === 'admin' ? 'Administrador' : 'Estudante';
    showConfirm(
      'Alterar Cargo',
      `Mudar usuário para ${roleName}?`,
      async () => {
        try {
          await updateUserProfile(userId, { role: newRole });
          setUsers(users.map(u => (u.id === userId || u.uid === userId) ? { ...u, role: newRole } : u));
          showSuccess(`Permissões de ${roleName} concedidas!`);
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

  if (loading) return (
     <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-gray-400 font-medium">Carregando usuários...</p>
        </div>
     </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-gray-200">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
               <User size={24} />
             </div>
             <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
               Gerenciar Usuários
             </h1>
           </div>
          <p className="text-gray-500 font-medium ml-1">
             {users.length} membros cadastrados na plataforma.
          </p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
          />
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl w-fit">
        {[
          { id: 'users', label: 'Estudantes', icon: User },
          { id: 'admins', label: 'Administradores', icon: Shield }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'users' | 'admins')}
            className={clsx(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300",
              activeTab === tab.id 
                 ? "bg-white text-blue-600 shadow-sm scale-[1.02]" 
                 : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Modern Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full">
             <thead>
               <tr className="bg-gray-50/50 border-b border-gray-100">
                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Atividade</th>
                 <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {filteredUsers.length === 0 ? (
                  <tr>
                     <td colSpan={4} className="p-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-3">
                           <Search size={40} className="text-gray-200" />
                           <p>Nenhum usuário encontrado com esses filtros.</p>
                        </div>
                     </td>
                  </tr>
               ) : filteredUsers.map((u) => {
                 const userId = u.id || u.uid;
                 const isAdmin = u.role === 'admin';
                 
                 return (
                   <tr key={userId} className="hover:bg-blue-50/30 transition-colors group">
                     {/* User Identity Column */}
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-4">
                         <div className={clsx(
                            "relative w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm border-2",
                            isAdmin ? "bg-purple-100 text-purple-600 border-purple-200" : "bg-blue-50 text-blue-600 border-blue-100"
                         )}>
                           {u.photoURL ? (
                              <img src={u.photoURL} alt={u.displayName} className="w-full h-full rounded-full object-cover" />
                           ) : (
                              u.displayName?.charAt(0).toUpperCase()
                           )}
                           {/* Online indicator placeholder (if needed in future) */}
                           {/* <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div> */}
                         </div>
                         <div>
                           <div className="font-semibold text-gray-900">{u.displayName}</div>
                           <div className="text-xs text-gray-500">{u.email}</div>
                         </div>
                       </div>
                     </td>

                     {/* Status Column */}
                     <td className="px-6 py-4">
                       <div className="flex flex-col gap-2 items-start">
                          {/* Role Badge */}
                          {isAdmin && (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                <Shield size={12} /> Admin
                             </span>
                          )}
                          
                          {/* Premium Toggle */}
                          <button 
                             onClick={() => handlePremiumToggle(userId, u.isPremium)}
                             className={clsx(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95",
                                u.isPremium 
                                   ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" 
                                   : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                             )}
                          >
                             {u.isPremium ? <Sparkles size={12} className="text-amber-500" fill="currentColor" /> : <User size={12} />}
                             {u.isPremium ? 'Premium' : 'Básico'}
                          </button>
                       </div>
                     </td>

                     {/* Activity Column */}
                     <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-700">
                             {u.dailyExercisesCount || 0} questões
                          </span>
                          <span className="text-xs text-gray-400">Resolvidas hoje</span>
                       </div>
                     </td>

                     {/* Actions Column */}
                     <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                         <button 
                           onClick={() => handleEditUser(u)} 
                           className="p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                           title="Editar perfil"
                         >
                           <Edit size={18} />
                         </button>
                         <button 
                           onClick={() => handleRoleChange(userId, isAdmin ? 'user' : 'admin')} 
                           className={clsx(
                              "p-2 rounded-lg transition-colors",
                              isAdmin ? "text-purple-600 bg-purple-50 hover:bg-purple-100" : "text-gray-400 hover:bg-purple-50 hover:text-purple-600"
                           )}
                           title={isAdmin ? "Remover admin" : "Promover a admin"}
                         >
                           <Shield size={18} />
                         </button>
                         <button 
                           onClick={() => handleDeleteUser(userId)} 
                           className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                           title="Excluir usuário"
                         >
                           <Trash2 size={18} />
                         </button>
                       </div>
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Editar Usuário</h3>
              <button 
                 onClick={() => setEditingUser(null)} 
                 className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                 <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wide block mb-2">
                   Nome de Exibição
                </label>
                <input 
                   type="text" 
                   value={editingUser.displayName} 
                   onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })} 
                   className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none font-medium transition-all"
                   placeholder="Nome completo"
                />
              </div>
              
              <div className="flex gap-4 pt-2">
                <button 
                   onClick={() => setEditingUser(null)} 
                   className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                >
                   Cancelar
                </button>
                <button 
                   onClick={handleSaveEdit} 
                   className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                   Salvar Alterações
                </button>
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
