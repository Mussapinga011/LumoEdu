import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getLearningQuestionsBySession, saveLearningQuestion, deleteLearningQuestion,
  getLearningSectionsBySession, saveLearningSection, deleteLearningSection
} from '../../services/contentService.supabase';
import { Plus, Edit2, Trash2, ArrowLeft, X, BookOpen, HelpCircle, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import RichTextRenderer from '../../components/RichTextRenderer';

type ContentItem = 
  | { type: 'theory', id: string, title?: string, content: string, order_index: number }
  | { type: 'question', id: string, statement: string, options: string[], correct_option: number, explanation?: string, order_index: number };

// Sub-componente para Input com Preview
const LiveInput = ({ 
  label, 
  value, 
  onChange, 
  height = 'h-32', 
  placeholder,
  required = false 
}: {
  label: string, value: string, onChange: (v: string) => void, height?: string, placeholder?: string, required?: boolean
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end px-2">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label} <span className="text-gray-400 font-normal normal-case text-[10px]">(Markdown/LaTeX)</span></label>
        {required && <span className="text-red-500 text-xs font-bold">*Obrigatório</span>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <textarea 
          required={required}
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className={`w-full p-3 bg-gray-50 rounded-xl font-mono text-sm border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all resize-y ${height}`}
          placeholder={placeholder || "Digite aqui... Use $$ formula $$ para LaTeX"}
      />
      <div className={`w-full p-3 bg-white rounded-xl border border-gray-200 overflow-x-auto overflow-y-auto ${height} prose prose-sm max-w-none`}>
          <div className="px-2 pb-2">
            {value ? <RichTextRenderer content={value} /> : <span className="text-gray-300 italic text-sm">A pré-visualização aparecerá aqui...</span>}
          </div>
      </div>
    </div>
  </div>
);

const AdminLearningQuestionsPage = () => {
  const { disciplineId, sectionId, sessionId } = useParams<{ disciplineId: string, sectionId: string, sessionId: string }>();
  const navigate = useNavigate();
  
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [isTheoryModalOpen, setIsTheoryModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  
  // Estado de Edição
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // States dos Formulários
  const [theoryForm, setTheoryForm] = useState({ title: '', content: '', order_index: 0 });
  
  const [questionForm, setQuestionForm] = useState<{
    statement: string,
    options: string[],
    correctOption: number,
    explanation: string,
    order_index: number
  }>({
    statement: '',
    options: ['', '', '', ''],
    correctOption: 0,
    explanation: '',
    order_index: 0
  });

  useEffect(() => {
    if (sessionId) fetchContent();
  }, [sessionId]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const [questions, theories] = await Promise.all([
        getLearningQuestionsBySession(sessionId!),
        getLearningSectionsBySession(sessionId!)
      ]);

      const mappedQuestions = (questions || []).map((q: any) => ({
        ...q,
        type: 'question',
        options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : []),
        order_index: (q.order_index || 0) + 1000
      }));

      const mappedTheories = (theories || []).map((t: any) => ({
        ...t,
        type: 'theory',
        order_index: t.order_index || 0
      }));

      const merged = [...mappedTheories, ...mappedQuestions].sort((a, b) => a.order_index - b.order_index);
      setContent(merged as ContentItem[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- THEORY HANDLERS ---
  const openTheoryModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setTheoryForm({ title: item.title, content: item.content, order_index: item.order_index });
    } else {
      setEditingId(null);
      setTheoryForm({ title: '', content: '', order_index: content.length * 10 });
    }
    setIsTheoryModalOpen(true);
  };

  const handleSaveTheory = async (e: React.FormEvent) => {
    e.preventDefault();
    const theory = {
      id: editingId || crypto.randomUUID(),
      sessionId,
      discipline_id: disciplineId,
      title: theoryForm.title,
      content: theoryForm.content,
      orderIndex: theoryForm.order_index,
    };
    await saveLearningSection(theory);
    setIsTheoryModalOpen(false);
    fetchContent();
  };

  // --- QUESTION HANDLERS ---
  const openQuestionModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      let opts = item.options;
      if (typeof opts === 'string') {
          try { opts = JSON.parse(opts); } catch { opts = ['', '', '', '']; }
      }
      setQuestionForm({
        statement: item.statement || item.question_text || '',
        options: Array.isArray(opts) ? opts : ['', '', '', ''],
        correctOption: item.correct_option ?? item.correctOption ?? 0,
        explanation: item.explanation || '',
        order_index: item.order_index
      });
    } else {
      setEditingId(null);
      setQuestionForm({
        statement: '',
        options: ['', '', '', ''],
        correctOption: 0,
        explanation: '',
        order_index: content.length * 10 + 5
      });
    }
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = questionForm.options.filter(o => o.trim() !== '');
    if (validOptions.length < 2) {
        alert("A questão precisa de pelo menos 2 alternativas válidas.");
        return;
    }
    
    const question = {
      id: editingId || crypto.randomUUID(),
      sessionId,
      statement: questionForm.statement,
      options: questionForm.options,
      correctOption: Number(questionForm.correctOption),
      explanation: questionForm.explanation,
      orderIndex: questionForm.order_index,
    };

    await saveLearningQuestion(question);
    setIsQuestionModalOpen(false);
    fetchContent();
  };
  
  const handleAddOption = () => {
    if (questionForm.options.length >= 5) return;
    setQuestionForm(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const handleRemoveOption = (idx: number) => {
    if (questionForm.options.length <= 2) {
        alert("Mínimo de 2 opções obrigatório.");
        return;
    }
    const newOpts = questionForm.options.filter((_, i) => i !== idx);
    let newCorrect = questionForm.correctOption;
    if (newCorrect === idx) newCorrect = 0;
    else if (newCorrect > idx) newCorrect--;

    setQuestionForm(prev => ({ ...prev, options: newOpts, correctOption: newCorrect }));
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...questionForm.options];
    newOpts[idx] = val;
    setQuestionForm(prev => ({ ...prev, options: newOpts }));
  };

  const handleDelete = async (item: ContentItem) => {
    if (!confirm('Tem certeza que deseja excluir? Esta ação é irreversível.')) return;
    if (item.type === 'theory') await deleteLearningSection(item.id);
    else await deleteLearningQuestion(item.id);
    fetchContent();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Carregando conteúdo...</p>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-sm sticky top-4 z-40 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/admin/learning/${disciplineId}/sections/${sectionId}/sessions`)} className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
             <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
               Conteúdo da Aula
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-500">{content.length} itens</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
           <button onClick={() => openTheoryModal()} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm">
             <Plus size={16} /> Teoria
           </button>
           <button onClick={() => openQuestionModal()} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm">
             <Plus size={16} /> Questão
           </button>
        </div>
      </div>

      {/* Lista de Conteúdo */}
      <div className="space-y-5">
        {content.length === 0 ? (
           <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                  <Sparkles size={28} />
               </div>
               <p className="text-gray-400 font-bold text-lg">Nenhum conteúdo criado</p>
               <p className="text-gray-300 text-sm">Adicione teoria ou questões para começar.</p>
           </div>
        ) : content.map((item, idx) => (
          <div key={item.id} className={clsx("group relative p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all", item.type === 'theory' ? "bg-gradient-to-br from-violet-50/30 to-purple-50/30 border-violet-100 hover:border-violet-300" : "bg-white border-gray-100 hover:border-green-200")}>
             
             {/* Ações */}
             <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-mono text-gray-300 mr-1">#{idx + 1}</span>
                <button onClick={() => item.type === 'theory' ? openTheoryModal(item) : openQuestionModal(item)} className="p-2 bg-white text-gray-400 border border-gray-100 rounded-lg hover:text-violet-600 hover:border-violet-200 transition-colors">
                   <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(item)} className="p-2 bg-white text-gray-400 border border-gray-100 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors">
                   <Trash2 size={14} />
                </button>
             </div>

             <div className="flex gap-5">
                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", item.type === 'theory' ? "bg-violet-100 border-violet-200 text-violet-600" : "bg-green-100 border-green-200 text-green-600")}>
                   {item.type === 'theory' ? <BookOpen size={20} /> : <HelpCircle size={20} />}
                </div>
                
                <div className="flex-1 min-w-0">
                   {item.type === 'theory' ? (
                      <div className="space-y-3">
                         <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>
                         <div className="bg-white/60 p-4 rounded-xl border border-violet-100 text-gray-600 prose prose-sm max-w-none line-clamp-4">
                             <RichTextRenderer content={item.content} />
                         </div>
                      </div>
                   ) : (
                      <div className="space-y-3">
                         <h3 className="font-semibold text-gray-700 text-base"><RichTextRenderer content={item.statement} /></h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.options.map((opt, i) => (
                               <div key={i} className={clsx("text-sm p-2.5 rounded-lg border flex items-center gap-2", i === item.correct_option ? "bg-green-50 border-green-200 text-green-800 font-semibold" : "bg-white border-gray-100 text-gray-500")}>
                                  <span className={clsx("w-5 h-5 rounded flex items-center justify-center text-xs font-bold border", i === item.correct_option ? "bg-green-200 border-green-300 text-green-700" : "bg-gray-50 border-gray-200 text-gray-400")}>
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  <span className="truncate text-xs"><RichTextRenderer content={opt} /></span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* --- MODAL TEORIA --- */}
      {isTheoryModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-6">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 md:p-8 w-full max-w-4xl shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 h-[92vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <span className="w-9 h-9 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center">
                       <BookOpen size={18}/>
                    </span>
                    {editingId ? 'Editar Teoria' : 'Nova Teoria'}
                </h2>
                <button onClick={() => setIsTheoryModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                   <X size={22} />
                </button>
            </div>
            
            <form onSubmit={handleSaveTheory} className="flex-1 flex flex-col gap-5 overflow-hidden">
               <div className="flex-1 overflow-y-auto space-y-5 pr-2">
                   <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Título do Tópico</label>
                       <input 
                           required 
                           value={theoryForm.title} 
                           onChange={e => setTheoryForm({...theoryForm, title: e.target.value})}
                           placeholder="Ex: Introdução à Cinemática" 
                           className="w-full p-3 bg-gray-50 rounded-xl font-bold text-lg border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all" 
                        />
                   </div>
                   
                   <LiveInput 
                      label="Conteúdo da Teoria"
                      required
                      value={theoryForm.content}
                      onChange={v => setTheoryForm({...theoryForm, content: v})}
                      height="h-[400px]"
                      placeholder="# Título Principal\n\nTexto explicativo...\n\n$$ E = mc^2 $$"
                   />
               </div>

               <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsTheoryModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 hover:bg-violet-700 transition-all active:scale-[0.98]">Salvar Teoria</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL QUESTÃO --- */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-6">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 md:p-8 w-full max-w-5xl shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 h-[95vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <span className="w-9 h-9 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                       <HelpCircle size={18}/>
                    </span>
                    {editingId ? 'Editar Questão' : 'Nova Questão'}
                </h2>
                <button onClick={() => setIsQuestionModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                   <X size={22} />
                </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="flex-1 flex flex-col gap-6 overflow-hidden">
               <div className="flex-1 overflow-y-auto space-y-6 pr-3">
                  
                  {/* ENUNCIADO */}
                  <LiveInput 
                      label="Enunciado da Questão"
                      required
                      value={questionForm.statement}
                      onChange={v => setQuestionForm({...questionForm, statement: v})}
                      height="h-32"
                  />

                  {/* ALTERNATIVAS */}
                  <div className="space-y-4">
                      <div className="flex justify-between items-center px-2 border-b border-gray-100 pb-2">
                          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Alternativas ({questionForm.options.length})</label>
                          <button 
                            type="button" 
                            onClick={handleAddOption} 
                            disabled={questionForm.options.length >= 5}
                            className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50"
                          >+ Adicionar</button>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                          {questionForm.options.map((opt, i) => (
                             <div key={i} className="flex gap-3 items-start group">
                                <div className="pt-3 flex flex-col items-center gap-2">
                                   <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 font-bold flex items-center justify-center text-sm">
                                      {String.fromCharCode(65 + i)}
                                   </div>
                                   <input 
                                     type="radio" 
                                     name="correctOption" 
                                     checked={questionForm.correctOption === i} 
                                     onChange={() => setQuestionForm({...questionForm, correctOption: i})}
                                     className="w-4 h-4 accent-green-500 cursor-pointer"
                                     title="Marcar como correta"
                                   />
                                </div>
                                
                                <div className="flex-1">
                                    <LiveInput 
                                        label={`Opção ${String.fromCharCode(65 + i)} ${questionForm.correctOption === i ? '✓ CORRETA' : ''}`}
                                        value={opt}
                                        onChange={(v) => handleOptionChange(i, v)}
                                        height="h-20"
                                        required
                                        placeholder={`Texto da alternativa ${String.fromCharCode(65 + i)}`}
                                    />
                                </div>

                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveOption(i)} 
                                  className="mt-6 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                  title="Remover opção"
                                >
                                    <Trash2 size={16} />
                                </button>
                             </div>
                          ))}
                      </div>
                  </div>

                  {/* EXPLICAÇÃO */}
                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                      <LiveInput 
                          label="Explicação da Resposta (Opcional)"
                          value={questionForm.explanation}
                          onChange={v => setQuestionForm({...questionForm, explanation: v})}
                          height="h-20"
                          placeholder="Aparecerá para o aluno após responder..."
                      />
                  </div>

               </div>

               <div className="flex gap-3 pt-4 border-t border-gray-100 bg-white z-10">
                  <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all active:scale-[0.98]">Salvar Questão</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLearningQuestionsPage;
