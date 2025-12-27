import { useState, useEffect } from 'react';
import { StudyGroup } from '../../types/group';
import { getAvailableGroups, deleteGroup, createGroup } from '../../services/groupService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useContentStore } from '../../stores/useContentStore';
import { Trash2, Users, MessageCircle, AlertCircle, Plus, Edit2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const AdminGroupsPage = () => {
  const { user } = useAuthStore();
  const { disciplines, fetchContent } = useContentStore();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ groupId: string; groupName: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudyGroup | null>(null);

  // Form states
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
      const allGroups = await getAvailableGroups();
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
      await deleteGroup(deleteConfirm.groupId, user.uid, user.role);
      setToast({ message: `Grupo "${deleteConfirm.groupName}" deletado com sucesso!`, type: 'success' });
      loadGroups();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      setToast({ 
        message: error.message || 'Erro ao deletar grupo. Verifique as permissões no Firebase.', 
        type: 'error' 
      });
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
        // Editar grupo existente
        await updateDoc(doc(db, 'groups', editingGroup.id), {
          name: formName,
          description: formDesc,
          disciplineId: formDiscipline || 'all',
          disciplineName
        });
        setToast({ message: 'Grupo atualizado com sucesso!', type: 'success' });
      } else {
        // Criar novo grupo
        await createGroup(user, {
          name: formName,
          description: formDesc,
          disciplineId: formDiscipline || 'all',
          disciplineName,
          isPrivate: false
        });
        setToast({ message: 'Grupo criado com sucesso!', type: 'success' });
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
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-2xl border-l-4 animate-slide-in flex items-start gap-3 ${
          toast.type === 'error' 
            ? 'bg-white border-red-500 text-gray-800' 
            : 'bg-white border-green-500 text-gray-800'
        }`}>
          <div className={`p-2 rounded-full shrink-0 ${
            toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
          }`}>
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">
              {toast.type === 'error' ? 'Erro' : 'Sucesso'}
            </h3>
            <p className="text-gray-600">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gerenciar Grupos</h1>
          <p className="text-gray-500 mt-1">
            Total de {groups.length} grupo(s) criado(s)
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-lg"
        >
          <Plus size={20} />
          Criar Grupo
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhum grupo criado ainda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-bold text-gray-700">Nome do Grupo</th>
                <th className="text-left p-4 font-bold text-gray-700">Disciplina</th>
                <th className="text-center p-4 font-bold text-gray-700">Membros</th>
                <th className="text-center p-4 font-bold text-gray-700">Criado em</th>
                <th className="text-center p-4 font-bold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                        <MessageCircle size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{group.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{group.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-gray-600">{group.disciplineName}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                      <Users size={14} />
                      {group.membersCount}
                    </span>
                  </td>
                  <td className="p-4 text-center text-sm text-gray-500">
                    {group.createdAt?.toDate().toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(group)}
                        className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(group.id, group.name)}
                        className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                        Deletar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar/Editar Grupo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scale-in">
            <h2 className="text-2xl font-bold mb-4">
              {editingGroup ? 'Editar Grupo' : 'Criar Novo Grupo'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Grupo</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Ex: Feras da Matemática"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Disciplina</label>
                <select
                  value={formDiscipline}
                  onChange={e => setFormDiscipline(e.target.value)}
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
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
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
                  disabled={saving}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingGroup ? 'Atualizar' : 'Criar Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default AdminGroupsPage;
