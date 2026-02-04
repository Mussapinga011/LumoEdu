import { useState, useEffect, useCallback } from 'react';
import { StudyGroup } from '../../types/group';
import { 
  getAllGroups, 
  deleteGroup, 
  createGroup, 
  updateGroup, 
  getGroupMembers, 
  removeMember, 
  joinGroup,
  countUserCreatedGroups
} from '../../services/groupService.supabase';
import { useAuthStore } from '../../stores/useAuthStore';
import { useContentStore } from '../../stores/useContentStore';
import { supabase } from '../../lib/supabase';
import { 
  Trash2, 
  Users, 
  MessageCircle, 
  AlertCircle, 
  Plus, 
  Edit2, 
  Search, 
  Shield, 
  Calendar,
  Layers,
  CheckCircle2,
  X,
  User,
  UserMinus,
  UserPlus,
  Loader2
} from 'lucide-react';
import clsx from 'clsx';

interface MemberWithDetails {
  userId: string;
  role: string;
  joinedAt: string;
  displayName: string;
  photoURL?: string;
  email: string;
}

const AdminGroupsPage = () => {
  const { user } = useAuthStore();
  const { disciplines, fetchContent } = useContentStore();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ groupId: string; groupName: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudyGroup | null>(null);

  // Estados para Gerenciamento de Membros
  const [showMembersModal, setShowMembersModal] = useState<StudyGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<MemberWithDetails[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDiscipline, setFormDiscipline] = useState('');
  const [saving, setSaving] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const allGroups = await getAllGroups();
      setGroups(allGroups);
    } catch (error: any) {
      console.error('AdminGroupsPage: Error loading groups:', error);
      const errorMessage = error?.message || error?.details || 'Erro de conexão com o banco de dados';
      setToast({ 
        message: `Não foi possível carregar os grupos: ${errorMessage}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    fetchContent();
  }, [loadGroups, fetchContent]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDelete = (groupId: string, groupName: string) => {
    setDeleteConfirm({ groupId, groupName });
  };

  const confirmDelete = async () => {
    if (!user || !deleteConfirm) return;

    try {
      await deleteGroup(deleteConfirm.groupId, user.id, user.role);
      setToast({ message: `O grupo "${deleteConfirm.groupName}" foi removido permanentemente.`, type: 'success' });
      loadGroups();
    } catch (error: any) {
      console.error('AdminGroupsPage: Error deleting group:', error);
      setToast({ message: 'Falha ao remover o grupo. Verifique as permissões de RLS.', type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCreateNew = () => {
    setFormName('');
    setFormDesc('');
    setFormDiscipline('');
    setEditingGroup(null);
    setShowCreateModal(true);
  };

  const handleEdit = (group: StudyGroup) => {
    setFormName(group.name);
    setFormDesc(group.description);
    setFormDiscipline(group.disciplineId);
    setEditingGroup(group);
    setShowCreateModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Regra: Estudante só pode criar 1 grupo
      if (!editingGroup && user.role !== 'admin') {
        const createdCount = await countUserCreatedGroups(user.id);
        if (createdCount >= 1) {
          throw new Error('Estudantes podem criar apenas um grupo. Apague o grupo antigo para criar um novo.');
        }
      }

      const discipline = disciplines.find(d => d.id === formDiscipline);
      const disciplineName = discipline ? discipline.title : 'Geral';

      if (editingGroup) {
        await updateGroup(editingGroup.id, {
          name: formName,
          description: formDesc,
          discipline_id: formDiscipline || null,
          discipline_name: disciplineName
        });
        setToast({ message: 'Alterações salvas com sucesso!', type: 'success' });
      } else {
        await createGroup(user.id, {
          name: formName,
          description: formDesc,
          discipline_id: formDiscipline || null,
          discipline_name: disciplineName,
          is_private: false
        });
        setToast({ message: 'Novo canal de estudo criado e pronto para uso!', type: 'success' });
      }

      setShowCreateModal(false);
      loadGroups();
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao processar solicitação', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Gerenciamento de Membros
  const handleManageMembers = async (group: StudyGroup) => {
    setShowMembersModal(group);
    setLoadingMembers(true);
    try {
      const members = await getGroupMembers(group.id);
      setGroupMembers(members);
    } catch (error) {
      setToast({ message: 'Erro ao carregar membros do grupo.', type: 'error' });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleExpelMember = async (targetUserId: string) => {
    if (!showMembersModal) return;
    try {
      await removeMember(showMembersModal.id, targetUserId);
      setGroupMembers(prev => prev.filter(m => m.userId !== targetUserId));
      setToast({ message: 'Membro removido do grupo!', type: 'success' });
      loadGroups(); // Atualizar contagem
    } catch (error) {
      setToast({ message: 'Erro ao remover membro.', type: 'error' });
    }
  };

  const handleAddMemberByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMembersModal || !newMemberEmail) return;

    setAddingMember(true);
    try {
      // Buscar usuário pelo email
      const { data: targetUser, error: searchError } = await supabase
        .from('user_profiles')
        .select('id, display_name, email')
        .eq('email', newMemberEmail)
        .maybeSingle();

      if (searchError || !targetUser) {
        throw new Error('Usuário não encontrado com este email.');
      }

      // Adicionar ao grupo
      await joinGroup(showMembersModal.id, targetUser.id);
      
      // Recarregar lista
      const members = await getGroupMembers(showMembersModal.id);
      setGroupMembers(members);
      setNewMemberEmail('');
      setToast({ message: `${targetUser.display_name} adicionado com sucesso!`, type: 'success' });
      loadGroups();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setAddingMember(false);
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.disciplineName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-xs">Sincronizando Comunidade...</p>
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
          toast.type === 'success' ? 'bg-white/90 border-green-500' : 'bg-white/90 border-blue-500'
        )}>
          <div className={clsx(
            "p-2.5 rounded-xl shrink-0",
            toast.type === 'error' ? 'bg-red-100 text-red-600' : 
            toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
          )}>
            {toast.type === 'error' ? <AlertCircle size={24} /> : 
             toast.type === 'success' ? <CheckCircle2 size={24} /> : <Layers size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-gray-800 text-lg leading-tight">
              {toast.type === 'error' ? 'Ops! Algo deu errado' : 
               toast.type === 'success' ? 'Missão cumprida!' : 'Informação'}
            </h3>
            <p className="text-gray-600 text-sm font-medium mt-1 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-indigo-950 p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-primary-light text-xs font-black uppercase tracking-[0.2em] mb-4 border border-white/10">
              <Shield size={14} /> Painel Administrativo
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-none uppercase italic">
              GESTÃO DE <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent italic">COMUNIDADE</span>
            </h1>
            <p className="text-indigo-100/70 font-medium max-w-md text-lg italic">
              Controle moderado e suporte para maximizar a troca de conhecimentos no LumoEdu.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-auto">
            <button 
              onClick={handleCreateNew} 
              className="flex items-center justify-center gap-3 bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/30 active:scale-95 group uppercase"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" /> 
              LANÇAR CANAL DE ELITE
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou disciplina..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 rounded-[1.5rem] py-4 pl-14 pr-6 font-bold text-gray-800 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-gray-200">
          <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={48} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Nenhum grupo encontrado</h2>
          <p className="text-gray-400 font-medium mt-2">Tente ajustar sua busca ou crie um novo canal de estudo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div key={group.id} className="bg-white rounded-[2rem] p-8 border-2 border-gray-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
               {/* Accent decoration */}
               <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500"></div>
               
               <div className="flex justify-between items-start mb-6">
                 <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                   <MessageCircle size={32} />
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => handleEdit(group)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar"><Edit2 size={18} /></button>
                   <button onClick={() => handleDelete(group.id, group.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir"><Trash2 size={18} /></button>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                   <Layers size={12} /> {group.disciplineName || 'Geral'}
                 </div>
                 <h3 className="text-2xl font-black text-gray-800 leading-tight tracking-tighter uppercase line-clamp-1">{group.name}</h3>
                 <p className="text-gray-400 font-medium text-sm line-clamp-2 leading-relaxed h-10 italic">
                    {group.description}
                 </p>
               </div>

               <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                 <button 
                  onClick={() => handleManageMembers(group)}
                  className="flex items-center gap-3 hover:bg-gray-50 px-3 py-2 rounded-xl transition-all"
                 >
                   <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-400 overflow-hidden">
                           <User size={14} />
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                         {group.memberCount}
                      </div>
                   </div>
                   <span className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors">Gerenciar Membros</span>
                 </button>
                 
                 <div className="flex items-center gap-2 text-gray-400">
                   <Calendar size={14} />
                   <span className="text-[10px] font-extrabold uppercase tracking-widest">Ativo</span>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-4xl font-black tracking-tighter uppercase italic">{editingGroup ? 'Editar Canal' : 'Novo Canal'}</h2>
              <button onClick={() => setShowCreateModal(false)} className="bg-gray-100 text-gray-500 p-3 rounded-full hover:bg-gray-200 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Identidade do Grupo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Feras da Matemática"
                    required 
                    value={formName} 
                    onChange={e => setFormName(e.target.value)} 
                    className="w-full p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none font-bold text-gray-800 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Foco por Disciplina</label>
                  <select 
                    value={formDiscipline} 
                    onChange={e => setFormDiscipline(e.target.value)} 
                    className="w-full p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none font-bold text-gray-800 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:20px] bg-[right_1.25rem_center] bg-no-repeat transition-all"
                  >
                    <option value="">Geral / Comunidade</option>
                    {disciplines.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Propósito do Canal</label>
                <textarea 
                  placeholder="Descreva o que os estudantes vão encontrar aqui..."
                  required 
                  value={formDesc} 
                  onChange={e => setFormDesc(e.target.value)} 
                  className="w-full p-6 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none h-32 font-bold text-gray-800 transition-all resize-none italic" 
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 bg-primary text-white py-6 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      PROCESSANDO...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={24} />
                      {editingGroup ? 'ATUALIZAR CONFIGURAÇÕES' : 'LANÇAR NOVO GRUPO'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] p-10 w-full max-w-2xl shadow-3xl border-4 border-white animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">Membros do Grupo</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">{showMembersModal.name}</p>
                </div>
                <button onClick={() => setShowMembersModal(null)} className="bg-gray-100 text-gray-400 p-3 rounded-full hover:bg-red-50 hover:text-red-500 transition-all">
                  <X size={24} />
                </button>
              </div>

              {/* Add Member Form */}
              <form onSubmit={handleAddMemberByEmail} className="flex gap-2 mb-8">
                <div className="relative flex-1">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="Email do estudante para adicionar..."
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white p-4 pl-12 rounded-2xl outline-none font-bold transition-all"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={addingMember}
                  className="bg-indigo-600 text-white px-8 rounded-2xl font-black text-sm uppercase hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                   {addingMember ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                   ADICIONAR
                </button>
              </form>

              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {loadingMembers ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Carregando lista...</p>
                  </div>
                ) : groupMembers.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-bold uppercase italic border-2 border-dashed rounded-2xl">
                    Nenhum membro ativo além de você.
                  </div>
                ) : (
                  groupMembers.map(member => (
                    <div key={member.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-[1.5rem] border-2 border-transparent hover:border-indigo-50 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black overflow-hidden ring-2 ring-white">
                            {member.photoURL ? <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" /> : member.displayName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-gray-800 tracking-tight flex items-center gap-2">
                              {member.displayName}
                              {member.role === 'admin' && <Shield size={14} className="text-amber-500" fill="currentColor" />}
                            </div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{member.email}</div>
                          </div>
                       </div>

                       {member.userId !== user?.id && (
                         <button 
                           onClick={() => handleExpelMember(member.userId)}
                           className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                           title="Expulsar"
                         >
                           <UserMinus size={20} />
                         </button>
                       )}
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center z-[130] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-12 w-full max-w-md text-center shadow-2xl border-4 border-red-50 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-lg shadow-red-100">
              <Trash2 size={48} />
            </div>
            
            <h2 className="text-4xl font-black text-gray-800 mb-4 tracking-tighter uppercase italic">Excluir Canal?</h2>
            <p className="text-gray-500 font-medium mb-10 text-lg leading-relaxed">
              Esta ação é <span className="text-red-600 font-bold uppercase tracking-widest text-sm underline decoration-wavy">Irreversível</span>. 
              O grupo <span className="text-gray-800 font-black italic">"{deleteConfirm.groupName}"</span> e todas as suas mensagens serão apagados.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete} 
                className="w-full bg-red-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-red-200 active:scale-95 transition-all"
              >
                SIM, EXCLUIR TUDO
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="w-full py-4 font-black text-gray-400 uppercase tracking-widest text-xs hover:text-gray-600 transition-colors"
              >
                CANCELAR E VOLTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGroupsPage;
