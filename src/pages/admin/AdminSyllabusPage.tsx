import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSyllabusTopicsByDiscipline, saveSyllabusTopic, deleteSyllabusTopic } from '../../services/practiceService.supabase';
import { Plus, Edit2, Trash2, ArrowLeft, X, BookText, Info, Clock, Star } from 'lucide-react';
import { useToast } from '../../hooks/useNotifications';
import Toast from '../../components/Toast';
import clsx from 'clsx';
import { useContentStore } from '../../stores/useContentStore';

const AdminSyllabusPage = () => {
  const { disciplineId } = useParams<{ disciplineId: string }>();
  const navigate = useNavigate();
  const { disciplines } = useContentStore();
  const { toastState, showSuccess, showError, closeToast } = useToast();
  
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any | null>(null);

  const currentDiscipline = disciplines.find(d => d.id === disciplineId);

  useEffect(() => {
    if (disciplineId) fetchTopics();
  }, [disciplineId]);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const data = await getSyllabusTopicsByDiscipline(disciplineId!);
      setTopics(data || []);
    } catch (err) {
      showError('Erro ao carregar tópicos do edital');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const topic = {
      id: editingTopic?.id,
      discipline_id: disciplineId,
      topic_name: formData.get('topic_name'),
      importance: Number(formData.get('importance')),
      estimated_hours: Number(formData.get('estimated_hours')),
    };

    try {
      await saveSyllabusTopic(topic);
      showSuccess(editingTopic ? 'Tópico atualizado!' : 'Tópico adicionado ao edital!');
      setIsModalOpen(false);
      fetchTopics();
    } catch (err) {
      showError('Erro ao salvar tópico');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar este tópico do edital? Isso pode afetar o cálculo de progresso dos alunos.')) {
      try {
        await deleteSyllabusTopic(id);
        showSuccess('Tópico removido');
        fetchTopics();
      } catch (err) {
        showError('Erro ao deletar tópico');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Carregando edital...</p>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-4">
           <button 
              onClick={() => navigate('/admin/learning')} 
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
           >
              <ArrowLeft size={24} />
           </button>
           <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <BookText size={24} />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Edital / Syllabus
                </h1>
              </div>
             <p className="text-gray-500 font-medium ml-1">
                Defina os tópicos oficiais de {currentDiscipline?.title || 'Disciplina'} para o acompanhamento acadêmico.
             </p>
           </div>
        </div>
        
        <button 
           onClick={() => { setEditingTopic(null); setIsModalOpen(true); }} 
           className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
        >
          <Plus size={18} /> Novo Tópico
        </button>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
         <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
            <Info size={20} />
         </div>
         <div>
            <h4 className="font-bold text-blue-800 mb-1">Por que gerenciar o edital?</h4>
            <p className="text-sm text-blue-700/80 leading-relaxed md:max-w-3xl">
               Estes tópicos são usados pelo **Tracking Acadêmico Inteligente**. 
               Quando você cria uma aula, pode vinculá-la a um destes tópicos para que o sistema saiba exatamente 
               o que o aluno está estudando e possa calcular a cobertura do edital e gerar recomendações personalizadas.
            </p>
         </div>
      </div>

      {/* Lista de Tópicos */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tópico do Edital</th>
              <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Peso/Importância</th>
              <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Est. Horas</th>
              <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {topics.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-20 text-center text-gray-400 font-bold">Nenhum tópico cadastrado no edital</td>
              </tr>
            ) : (
              topics.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{t.topic_name}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-1">
                       {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                             key={star} 
                             size={14} 
                             className={clsx(star <= (t.importance || 3) ? "text-amber-400 fill-amber-400" : "text-gray-200")} 
                          />
                       ))}
                    </div>
                  </td>
                  <td className="p-6 text-center text-gray-500 font-bold text-sm">
                    <div className="flex items-center justify-center gap-1.5">
                       <Clock size={14} />
                       {t.estimated_hours || 2}h
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingTopic(t); setIsModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                         <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                         <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-gray-800">
                 {editingTopic ? 'Editar Tópico' : 'Novo Tópico do Edital'}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nome do Tópico</label>
                <input 
                  name="topic_name" 
                  required 
                  defaultValue={editingTopic?.topic_name} 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold transition-all" 
                  placeholder="Ex: Cinemática Vetorial" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5 flex items-center gap-2">
                       Importância (1-5)
                       <Star size={14} className="text-amber-400 fill-amber-400" />
                    </label>
                    <select 
                      name="importance" 
                      defaultValue={editingTopic?.importance || 3} 
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none font-bold"
                    >
                       <option value="1">1 (Baixa)</option>
                       <option value="2">2</option>
                       <option value="3">3 (Normal)</option>
                       <option value="4">4</option>
                       <option value="5">5 (Crítica)</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5 flex items-center gap-2">
                       Horas Estimadas
                       <Clock size={14} className="text-indigo-500" />
                    </label>
                    <input 
                      type="number" 
                      name="estimated_hours" 
                      required 
                      defaultValue={editingTopic ? editingTopic.estimated_hours : 2} 
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none font-bold" 
                      placeholder="Ex: 4" 
                    />
                 </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:translate-y-0.5 hover:bg-indigo-700 transition-all">
                  Salvar Tópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastState.isOpen && <Toast message={toastState.message} type={toastState.type} onClose={closeToast} />}
    </div>
  );
};

export default AdminSyllabusPage;
