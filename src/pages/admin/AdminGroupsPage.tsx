import { useState, useEffect } from 'react';
import { StudyGroup } from '../../types/group';
import { getAllGroups, deleteGroup, createGroup, updateGroup } from '../../services/groupService.supabase';
import { useAuthStore } from '../../stores/useAuthStore';
import { useContentStore } from '../../stores/useContentStore';
import { Trash2, Users, MessageCircle, AlertCircle, Plus, Edit2 } from 'lucide-react';

const AdminGroupsPage = () => {
  const { user } = useAuthStore();
  const { disciplines, fetchContent } = useContentStore();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ groupId: string; groupName: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudyGroup | null>(null);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDiscipline, setFormDiscipline] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGroups();
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const allGroups = await getAllGroups();
      setGroups(allGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      setToast({ message: 'Erro ao carregar grupos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (groupId: string, groupName: string) => {
    setDeleteConfirm({ groupId, groupName });
  };

  const confirmDelete = async () => {
    if (!user || !deleteConfirm) return;

    try {
      // Ajustado para bater com a assinatura do groupService.supabase.ts
      await deleteGroup(deleteConfirm.groupId, user.id, user.role);
      setToast({ message: `Grupo "${deleteConfirm.groupName}" deletado com sucesso!`, type: 'success' });
      loadGroups();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      setToast({ message: 'Erro ao deletar grupo no Supabase.', type: 'error' });
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
      const discipline = disciplines.find(d => d.id === formDiscipline);
      const disciplineName = discipline ? discipline.title : 'Geral';

      if (editingGroup) {
        await updateGroup(editingGroup.id, {
          name: formName,
          description: formDesc,
          discipline_id: formDiscipline || null,
          discipline_name: disciplineName
        });
        setToast({ message: 'Grupo atualizado no Supabase!', type: 'success' });
      } else {
        // Ajustado para passar o objeto corretamente conforme o createGroup no Supabase
        await createGroup(user.id, {
          name: formName,
          description: formDesc,
          discipline_id: formDiscipline || null,
          discipline_name: disciplineName,
          is_private: false
        });
        setToast({ message: 'Novo grupo criado com sucesso!', type: 'success' });
      }

      setShowCreateModal(false);
      loadGroups();
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao salvar grupo', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-2xl border-l-4 animate-slide-in flex items-start gap-3 ${
          toast.type === 'error' ? 'bg-white border-red-500 text-gray-800' : 'bg-white border-green-500 text-gray-800'
        }`}>
          <div className={`p-2 rounded-full shrink-0 ${toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{toast.type === 'error' ? 'Erro' : 'Sucesso'}</h3>
            <p className="text-gray-600">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Gerenciar Comunidade</h1>
          <p className="text-gray-400 font-medium">Controle total sobre os {groups.length} canais de estudo.</p>
        </div>
        <button onClick={handleCreateNew} className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:translate-y-1">
          <Plus size={20} /> CRIAR GRUPO
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="text-left p-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">Identidade do Grupo</th>
                <th className="text-left p-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">Foco</th>
                <th className="text-center p-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">Membros</th>
                <th className="text-center p-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 text-primary p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                        <MessageCircle size={24} />
                      </div>
                      <div>
                        <div className="font-black text-gray-800 text-lg leading-tight uppercase tracking-tighter">{group.name}</div>
                        <div className="text-sm text-gray-400 font-medium line-clamp-1">{group.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-tighter">
                      {group.disciplineName || 'Geral'}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="inline-flex items-center gap-1 font-black text-gray-700">
                      <Users size={16} className="text-primary" />
                      {group.memberCount}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleEdit(group)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={20} /></button>
                      <button onClick={() => handleDelete(group.id, group.name)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-black mb-6 tracking-tighter uppercase">{editingGroup ? 'Editar Grupo' : 'Novo Grupo'}</h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome</label>
                <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none font-bold transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Disciplina</label>
                <select value={formDiscipline} onChange={e => setFormDiscipline(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary outline-none font-bold">
                  <option value="">Todas as Disciplinas</option>
                  {disciplines.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Descrição</label>
                <textarea required value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary outline-none h-24 font-bold" />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 font-black text-gray-400 uppercase tracking-tighter">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 active:translate-y-1">
                  {saving ? 'SALVANDO...' : 'CONFIRMAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-10 w-full max-w-sm text-center shadow-2xl border-4 border-red-50">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={40} /></div>
            <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tighter uppercase">Excluir Grupo?</h2>
            <p className="text-gray-500 font-medium mb-8">Essa ação irá apagar permanentemente o grupo <span className="text-red-600 font-bold">{deleteConfirm.groupName}</span> e seu histórico.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 font-black text-gray-400 uppercase tracking-tighter">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-200 active:translate-y-1">EXCLUIR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGroupsPage;
