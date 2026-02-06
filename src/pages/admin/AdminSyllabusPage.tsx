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
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-6 md:p-8 rounded-[2rem] text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-400/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 text-left">
            <button 
                onClick={() => navigate('/admin/learning')} 
                className="p-2.5 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all active:scale-95"
            >
                <ArrowLeft size={18} />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-[0.15em] mb-3 border border-white/10">
                <BookText size={12} /> Engenharia Pedagógica
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-1 leading-none uppercase italic">
                EDITAL / <span className="bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent italic">SYLLABUS</span>
              </h1>
              <p className="text-indigo-100/70 font-medium max-w-md text-sm italic">
                Defina os tópicos oficiais de {currentDiscipline?.title || 'Disciplina'} para o acompanhamento acadêmico.
              </p>
            </div>
          </div>
          
          <button 
             onClick={() => { setEditingTopic(null); setIsModalOpen(true); }} 
             className="flex items-center gap-2 bg-white text-indigo-950 px-6 py-3 rounded-xl font-black text-sm hover:bg-white/90 transition-all shadow-lg active:scale-95 group uppercase tracking-tighter"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Novo Tópico
          </button>
        </div>
      </div>

      <div className="bg-indigo-50/50 p-5 rounded-[2rem] border-2 border-indigo-50 flex items-start gap-4">
         <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
            <Info size={18} />
         </div>
         <div>
            <h4 className="font-black text-indigo-900 text-xs uppercase tracking-widest mb-1 italic">Por que gerenciar o edital?</h4>
            <p className="text-[11px] text-indigo-800/60 font-medium leading-relaxed md:max-w-3xl italic">
               Estes tópicos são usados pelo <span className="text-indigo-900 font-black tracking-tight">Tracking Acadêmico Inteligente</span>. 
               Vincule aulas a estes tópicos para que o sistema calcule a cobertura do edital e gere recomendações personalizadas por IA.
            </p>
         </div>
      </div>

      {/* Lista de Tópicos */}
      <div className="bg-white rounded-[2rem] border-2 border-gray-50 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic pl-8">Tópico do Edital</th>
              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center italic">Peso</th>
              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center italic">Est. Horas</th>
              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right italic pr-8">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {topics.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-16 text-center text-gray-400 font-black uppercase text-[10px] tracking-widest">Nenhum tópico cadastrado</td>
              </tr>
            ) : (
              topics.map((t) => (
                <tr key={t.id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="p-4 pl-8">
                    <span className="font-black text-gray-800 text-sm uppercase tracking-tighter italic">{t.topic_name}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-0.5">
                       {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                             key={star} 
                             size={10} 
                             className={clsx(star <= (t.importance || 3) ? "text-amber-400 fill-amber-400" : "text-gray-200")} 
                          />
                       ))}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase italic">
                       <Clock size={10} /> {t.estimated_hours || 2}h
                    </div>
                  </td>
                  <td className="p-4 text-right pr-8">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => { setEditingTopic(t); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100">
                         <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100">
                         <Trash2 size={16} />
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
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-lg shadow-3xl border-4 border-white animate-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full -translate-y-24 translate-x-24 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div>
                 <h2 className="text-2xl font-black tracking-tighter uppercase italic">{editingTopic ? 'Editar Tópico' : 'Novo Alvo'}</h2>
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-1 italic">Engenharia de Edital</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-400 p-2 rounded-full hover:bg-gray-200 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Tópico</label>
                <input 
                  name="topic_name" 
                  required 
                  defaultValue={editingTopic?.topic_name} 
                  className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none font-black text-gray-800 transition-all text-base shadow-inner italic" 
                  placeholder="Ex: Cinemática Vetorial" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                       Importância
                       <Star size={10} className="text-amber-400 fill-amber-400" />
                    </label>
                    <select 
                      name="importance" 
                      defaultValue={editingTopic?.importance || 3} 
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 outline-none font-black text-gray-800 rounded-xl appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWPYcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:18px] bg-[right_1rem_center] bg-no-repeat text-sm"
                    >
                       <option value="1">1 (Baixa)</option>
                       <option value="2">2</option>
                       <option value="3">3 (Normal)</option>
                       <option value="4">4</option>
                       <option value="5">5 (Crítica)</option>
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                       Horas Estimadas
                       <Clock size={10} className="text-indigo-500" />
                    </label>
                    <input 
                      type="number" 
                      name="estimated_hours" 
                      required 
                      defaultValue={editingTopic ? editingTopic.estimated_hours : 2} 
                      className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 outline-none font-black text-gray-800 rounded-xl shadow-inner text-sm italic" 
                      placeholder="Ex: 4" 
                    />
                 </div>
              </div>
              
              <div className="flex gap-3 pt-6">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black text-base shadow-xl shadow-indigo-500/20 active:scale-95 hover:bg-indigo-700 transition-all uppercase tracking-tighter">
                  {editingTopic ? 'Atualizar Alvo' : 'Fixar no Edital'}
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
