import { useState, useEffect, useCallback } from 'react';
import { getAllUsers, updateUserProfile, deleteUser } from '../../services/dbService.supabase';
import { UserProfile } from '../../types/user';
import { 
  Search, 
  Edit, 
  X, 
  Trash2, 
  Shield, 
  User, 
  Star,
  AlertCircle,
  CheckCircle2,
  Layers,
  Loader2,
  Mail,
  Crown,
  SearchX,
  ShieldAlert,
  TrendingUp
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'users' | 'admins' | 'premium'>('users');
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setToast({ message: 'Erro ao sincronizar usuários.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
      setToast({ message: 'O nome do usuário não pode ser vazio.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(editingUser.id, { display_name: editingUser.displayName });
      setUsers(prev => prev.map(u => 
        (u.id === editingUser.id || u.uid === editingUser.id)
          ? { ...u, displayName: editingUser.displayName } 
          : u
      ));
      setToast({ message: 'Perfil atualizado com sucesso!', type: 'success' });
      setEditingUser(null);
    } catch (error: any) {
      setToast({ message: 'Erro ao atualizar: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteUser(deleteConfirm.id);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirm.id && u.uid !== deleteConfirm.id));
      setToast({ message: 'Usuário removido da plataforma.', type: 'success' });
    } catch (error) {
      setToast({ message: 'Falha ao remover conta.', type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateUserProfile(userId, { role: newRole });
      setUsers(prev => prev.map(u => (u.id === userId || u.uid === userId) ? { ...u, role: newRole } : u));
      setToast({ message: `Usuário agora é ${newRole === 'admin' ? 'Administrador' : 'Estudante'}.`, type: 'success' });
    } catch (error) {
      setToast({ message: 'Erro ao alterar permissões.', type: 'error' });
    }
  };

  const handlePremiumToggle = async (userId: string, currentPremium: boolean) => {
    try {
      await updateUserProfile(userId, { is_premium: !currentPremium });
      setUsers(prev => prev.map(u => (u.id === userId || u.uid === userId) ? { ...u, isPremium: !currentPremium } : u));
      setToast({ message: `Assinatura Premium ${currentPremium ? 'removida' : 'concedida'}!`, type: 'success' });
    } catch (error) {
      setToast({ message: 'Falha ao processar assinatura.', type: 'error' });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === 'admins') matchesTab = user.role === 'admin';
    else if (activeTab === 'premium') matchesTab = user.isPremium;
    else matchesTab = user.role !== 'admin';

    return matchesSearch && matchesTab;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    premium: users.filter(u => u.isPremium).length,
    activeToday: users.filter(u => u.dailyExercisesCount && u.dailyExercisesCount > 0).length
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-xs italic">Escaneando Base de Dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Toast System */}
      {toast && (
        <div className={clsx(
          "fixed top-6 right-6 z-[100] max-w-md p-5 rounded-2xl shadow-2xl border-l-4 animate-in slide-in-from-right duration-300 flex items-start gap-4 backdrop-blur-md",
          toast.type === 'error' ? 'bg-white/90 border-red-500' : 
          toast.type === 'success' ? 'bg-white/90 border-blue-500' : 'bg-white/90 border-amber-500'
        )}>
          <div className={clsx(
            "p-2.5 rounded-xl shrink-0",
            toast.type === 'error' ? 'bg-red-100 text-red-600' : 
            toast.type === 'success' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
          )}>
            {toast.type === 'error' ? <AlertCircle size={24} /> : 
             toast.type === 'success' ? <CheckCircle2 size={24} /> : <Layers size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-gray-800 text-lg leading-tight uppercase tracking-tighter italic">
              {toast.type === 'error' ? 'Falha' : 
               toast.type === 'success' ? 'Sucesso' : 'Note'}
            </h3>
            <p className="text-gray-600 text-sm font-medium mt-1 leading-relaxed italic">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-blue-300 text-xs font-black uppercase tracking-[0.2em] mb-4 border border-white/10 italic">
              <Shield size={14} /> Controle de Acessos
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-none uppercase italic">
              GESTÃO DE <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent italic">COMUNIDADE</span>
            </h1>
            <p className="text-blue-100/70 font-medium max-w-md text-lg italic leading-tight">
              Monitore o progresso, ajuste permissões e gerencie assinaturas da sua base de alunos.
            </p>
          </div>
          
          <div className="flex flex-col gap-6 w-full md:w-auto">
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex items-center justify-between gap-10">
              <div className="flex flex-col">
                <div className="text-4xl font-black text-white italic leading-none">{stats.total}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-300 mt-2">Total de Alunos</div>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="flex flex-col text-right">
                <div className="text-4xl font-black text-amber-400 italic leading-none">{stats.premium}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-300 mt-2 italic flex items-center gap-1 justify-end">
                  <Star size={10} fill="currentColor" /> Premium
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-10 text-blue-200/50">
              <div className="text-center">
                <div className="text-2xl font-black text-white italic">{stats.admins}</div>
                <div className="text-[10px] uppercase font-bold tracking-[0.2em] mt-1 italic">Moderadores</div>
              </div>
              <div className="w-px h-6 bg-white/10"></div>
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400 italic">{stats.activeToday}</div>
                <div className="text-[10px] uppercase font-bold tracking-[0.2em] mt-1 italic">Ativos Hoje</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col xl:flex-row gap-6 bg-white p-6 rounded-[2rem] shadow-xl border border-gray-50 items-center">
         <div className="flex-1 relative w-full group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={22} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome ou e-mail..." 
              className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-2xl font-bold text-gray-800 transition-all shadow-inner italic"
            />
         </div>
         
         <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full xl:w-auto">
            {[
               { id: 'users', label: 'ESTUDANTES', icon: User },
               { id: 'premium', label: 'PREMIUM', icon: Crown },
               { id: 'admins', label: 'EQUIPE', icon: Shield }
            ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={clsx(
                   "flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", 
                   activeTab === tab.id 
                      ? "bg-white text-blue-600 shadow-lg scale-105" 
                      : "text-gray-400 hover:text-gray-600"
                 )}
               >
                 <tab.icon size={14} />
                 {tab.label}
               </button>
            ))}
         </div>
      </div>

      {/* Users Modern List */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest italic">Estudante</th>
                <th className="px-6 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest italic">Acesso / Plano</th>
                <th className="px-6 py-4 font-black text-[10px] text-gray-400 uppercase tracking-widest italic text-center">Atividade</th>
                <th className="px-6 py-4 text-right font-black text-[10px] text-gray-400 uppercase tracking-widest italic">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <SearchX size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 uppercase italic tracking-tighter">Nenhum resultado</h3>
                    <p className="text-gray-400 font-medium italic mt-1">Refine seus filtros ou termo de busca.</p>
                  </td>
                </tr>
              ) : filteredUsers.map((u) => {
                const userId = u.id || u.uid;
                const isAdmin = u.role === 'admin';
                const initials = u.displayName?.slice(0, 2).toUpperCase() || '??';
                
                return (
                  <tr key={userId} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-4">
                        <div className={clsx(
                          "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shadow-md ring-2 ring-white transition-transform group-hover:scale-105",
                          isAdmin ? "bg-indigo-600 text-white" : u.isPremium ? "bg-amber-400 text-white" : "bg-blue-100 text-blue-600"
                        )}>
                          {u.photoURL ? (
                             <img src={u.photoURL} alt={u.displayName} className="w-full h-full rounded-xl object-cover" />
                          ) : initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-gray-800 text-base leading-none uppercase tracking-tighter mb-1 italic flex items-center gap-2 truncate">
                            {u.displayName}
                            {u.isPremium && <Crown size={14} className="text-amber-500 shrink-0" fill="currentColor" />}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 tracking-wider italic truncate">
                            <span className="flex items-center gap-1"><Mail size={10} /> {u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3">
                       <div className="flex items-center gap-2">
                          <button 
                             onClick={() => handleRoleChange(userId, isAdmin ? 'user' : 'admin')}
                             className={clsx(
                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                                isAdmin ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-gray-50 text-gray-400 border-gray-100 opacity-60 hover:opacity-100"
                             )}
                          >
                             {isAdmin ? 'ADMIN' : 'USER'}
                          </button>
                          
                          <button 
                             onClick={() => handlePremiumToggle(userId, u.isPremium)}
                             className={clsx(
                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-1",
                                u.isPremium ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-gray-50 text-gray-400 border-gray-100 opacity-60 hover:opacity-100"
                             )}
                          >
                             {u.isPremium ? (
                               <>
                                 <Star size={10} fill="currentColor" />
                                 PREMIUM
                               </>
                             ) : 'BÁSICO'}
                          </button>
                       </div>
                    </td>

                    <td className="px-6 py-3">
                       <div className="flex flex-col items-center gap-0 italic">
                          <div className="flex items-center gap-1.5 text-blue-600">
                             <TrendingUp size={12} />
                             <span className="text-sm font-black leading-none">{u.dailyExercisesCount || 0}</span>
                          </div>
                          <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Hoje</span>
                       </div>
                    </td>

                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleEditUser(u)} 
                          className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                          title="Ficha"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm({ id: userId, name: u.displayName })} 
                          className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                          title="Banir"
                        >
                          <Trash2 size={16} />
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

      {/* Modal Profile Editor */}
      {editingUser && (
        <div className="fixed inset-0 z-[120] bg-gray-900/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] p-10 md:p-12 w-full max-w-sm shadow-3xl border-4 border-white animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            
            <div className="flex items-center justify-between mb-10">
               <div>
                 <h2 className="text-3xl font-black tracking-tighter uppercase italic text-gray-800">Ficha de Usuário</h2>
                 <p className="text-blue-500 font-bold uppercase tracking-widest text-[10px] mt-1 italic">Edição de Identidade</p>
               </div>
               <button onClick={() => setEditingUser(null)} className="bg-gray-100 text-gray-400 p-3 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                  <X size={24} />
               </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                 <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome de Exibição (RG Digital)</label>
                 <input 
                    type="text" 
                    value={editingUser.displayName} 
                    onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })} 
                    className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-2xl font-black text-gray-800 transition-all italic text-xl shadow-inner placeholder:text-gray-300" 
                    placeholder="Nome completo..."
                 />
              </div>

              <div className="p-6 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                 <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 italic">E-mail Registrado</div>
                 <div className="font-bold text-gray-500 italic break-all">{editingUser.email}</div>
              </div>
              
              <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
                <button 
                   onClick={handleSaveEdit} 
                   disabled={saving}
                   className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl shadow-xl shadow-blue-200 active:scale-95 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter italic"
                >
                   {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                   Confirmar Atualização
                </button>
                <button 
                  onClick={() => setEditingUser(null)} 
                  className="w-full py-2 font-black text-gray-400 uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors italic"
                >
                  Voltar sem Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex items-center justify-center z-[130] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] p-12 w-full max-w-md text-center shadow-3xl border-4 border-red-50 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
            
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 rotate-12 shadow-lg shadow-red-100 flex-none ring-4 ring-white">
              <ShieldAlert size={48} />
            </div>
            
            <h2 className="text-4xl font-black text-gray-800 mb-4 tracking-tighter uppercase italic">Banir Estudante?</h2>
            <p className="text-gray-500 font-medium mb-10 text-lg leading-relaxed italic">
              Você está prestes a expurgar <span className="text-gray-800 font-black">"{deleteConfirm.name}"</span>. 
              Esta ação removerá todos os registros de progresso e assinatura permanentemente.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete} 
                className="w-full bg-red-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-red-200 active:scale-95 transition-all uppercase tracking-tighter italic"
              >
                Sim, Remover do Sistema
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="w-full py-4 font-black text-gray-400 uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors italic"
              >
                Cancelar Punição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
