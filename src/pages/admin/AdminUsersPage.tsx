import { useState, useEffect } from 'react';
import { getAllUsers, updateUserProfile } from '../../services/dbService';
import { UserProfile } from '../../types/user';
import { Search, Edit, X, Save } from 'lucide-react';
import { useModal, useToast } from '../../hooks/useNotifications';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';

interface EditingUser {
  uid: string;
  displayName: string;
  email: string;
  newPassword?: string;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      newPassword: ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    if (!editingUser.displayName || !editingUser.email) {
      showWarning('Nome e email são obrigatórios');
      return;
    }

    try {
      // Update Firestore profile
      const updates: Partial<UserProfile> = {
        displayName: editingUser.displayName,
        email: editingUser.email
      };
      
      await updateUserProfile(editingUser.uid, updates);
      
      // Update local state
      setUsers(users.map(u => 
        u.uid === editingUser.uid 
          ? { ...u, ...updates } 
          : u
      ));

      showSuccess('Usuário atualizado com sucesso!');
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      showError(getErrorMessage(error));
    }
  };

  const handleRoleChange = async (uid: string, newRole: 'admin' | 'user') => {
    const roleLabel = newRole === 'admin' ? 'Administrador' : 'Usuário';
    showConfirm(
      'Alterar Papel',
      `Tem certeza que deseja alterar o papel deste usuário para ${roleLabel}?`,
      async () => {
        try {
          await updateUserProfile(uid, { role: newRole });
          setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
          showSuccess(`Papel alterado para ${roleLabel} com sucesso!`);
        } catch (error) {
          console.error("Error updating user role:", error);
          showError(getErrorMessage(error));
        }
      },
      'Alterar',
      'Cancelar'
    );
  };

  const handlePremiumToggle = async (uid: string, currentPremium: boolean) => {
    const action = currentPremium ? 'remover' : 'conceder';
    showConfirm(
      currentPremium ? 'Remover Premium' : 'Conceder Premium',
      `Tem certeza que deseja ${action} acesso premium para este usuário?`,
      async () => {
        try {
          const updates: Partial<UserProfile> = {
            isPremium: !currentPremium
          };
          await updateUserProfile(uid, updates);
          setUsers(users.map(u => u.uid === uid ? { ...u, ...updates } : u));
          showSuccess(`Acesso premium ${currentPremium ? 'removido' : 'concedido'} com sucesso!`);
        } catch (error) {
          console.error("Error updating premium status:", error);
          showError(getErrorMessage(error));
        }
      },
      action === 'conceder' ? 'Conceder' : 'Remover',
      'Cancelar'
    );
  };

  const filteredUsers = users.filter(user => 
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Usuários</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Usuário</th>
              <th className="p-4 font-semibold text-gray-600">Papel</th>
              <th className="p-4 font-semibold text-gray-600">Premium</th>
              <th className="p-4 font-semibold text-gray-600">Estatísticas</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.uid} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4">
                  <div>
                    <p className="font-bold text-gray-800">{user.displayName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'admin' ? 'ADMIN' : 'USUÁRIO'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    user.isPremium ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.isPremium ? '⭐ PREMIUM' : 'GRÁTIS'}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  <p>Nível: {user.level}</p>
                  <p>Pontos: {user.score || 0}</p>
                </td>
                <td className="p-4 text-right">
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm font-bold transition-colors flex items-center gap-1"
                    >
                      <Edit size={14} />
                      Editar
                    </button>
                    {user.role === 'user' ? (
                      <button
                        onClick={() => handleRoleChange(user.uid, 'admin')}
                        className="text-purple-600 hover:bg-purple-50 px-3 py-1 rounded-lg text-sm font-bold transition-colors"
                      >
                        Promover a Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(user.uid, 'user')}
                        className="text-gray-600 hover:bg-gray-100 px-3 py-1 rounded-lg text-sm font-bold transition-colors"
                      >
                        Rebaixar a Usuário
                      </button>
                    )}
                    <button
                      onClick={() => handlePremiumToggle(user.uid, user.isPremium)}
                      className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${
                        user.isPremium 
                          ? 'text-gray-600 hover:bg-gray-100' 
                          : 'text-yellow-600 hover:bg-yellow-50'
                      }`}
                    >
                      {user.isPremium ? 'Remover Premium' : 'Conceder Premium'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Editar Usuário</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={editingUser.displayName}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">
                  Nota: Para redefinir a senha, use o botão "Redefinir Senha" na lista de usuários.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

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

export default AdminUsersPage;
