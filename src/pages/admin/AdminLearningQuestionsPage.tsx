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
  <div className="space-y-1.5">
    <div className="flex justify-between items-end px-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label} <span className="text-gray-300 font-bold normal-case text-[8px] italic">(MD/LaTeX)</span></label>
        {required && <span className="text-red-500 text-[9px] font-black uppercase tracking-tighter">*Obrigatório</span>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <textarea 
          required={required}
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className={`w-full p-3 bg-gray-50 rounded-xl font-mono text-xs border-2 border-transparent focus:border-violet-500 focus:bg-white outline-none transition-all resize-y shadow-inner ${height}`}
          placeholder={placeholder || "Use $$ formula $$ para LaTeX"}
      />
      <div className={`w-full p-3 bg-white rounded-xl border-2 border-gray-50 overflow-x-auto overflow-y-auto ${height} prose prose-xs max-w-none shadow-sm`}>
          <div className="px-1 pb-1">
            {value ? <RichTextRenderer content={value} /> : <span className="text-gray-300 italic text-[10px]">Preview...</span>}
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white/90 backdrop-blur-md p-4 rounded-3xl border-2 border-gray-50 shadow-xl sticky top-4 z-40 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/admin/learning/${disciplineId}/sections/${sectionId}/sessions`)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all active:scale-95">
             <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tighter italic leading-none">
               ENGENHARIA DE CONTEÚDO
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="bg-violet-50 text-violet-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-violet-100 italic">
                  {content.length} módulos ativos
                </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
           <button onClick={() => openTheoryModal()} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:shadow-lg active:scale-95 transition-all uppercase tracking-tighter">
             <Plus size={16} /> ADICIONAR TEORIA
           </button>
           <button onClick={() => openQuestionModal()} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:shadow-lg active:scale-95 transition-all uppercase tracking-tighter">
             <Plus size={16} /> CRIAR QUESTÃO
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
          <div key={item.id} className={clsx("group relative p-5 rounded-[2rem] border shadow-xl transition-all", item.type === 'theory' ? "bg-gradient-to-br from-violet-50/20 to-indigo-50/20 border-violet-100 hover:border-violet-300" : "bg-white border-gray-100 hover:border-emerald-200")}>
             
             {/* Ações */}
             <div className="absolute top-6 right-6 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                <span className="text-[10px] font-black text-gray-300 uppercase italic tracking-widest mr-2">ID: {idx + 1}</span>
                <button onClick={() => item.type === 'theory' ? openTheoryModal(item) : openQuestionModal(item)} className="p-2 bg-white text-gray-400 border-2 border-gray-50 rounded-xl hover:text-violet-600 hover:border-violet-100 transition-colors shadow-sm">
                   <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(item)} className="p-2 bg-white text-gray-400 border-2 border-gray-50 rounded-xl hover:text-red-500 hover:border-red-100 transition-colors shadow-sm">
                   <Trash2 size={14} />
                </button>
             </div>

             <div className="flex gap-4">
                <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm", item.type === 'theory' ? "bg-violet-100 border-violet-200 text-violet-600" : "bg-emerald-100 border-emerald-200 text-emerald-600")}>
                   {item.type === 'theory' ? <BookOpen size={20} /> : <HelpCircle size={20} />}
                </div>
                
                <div className="flex-1 min-w-0">
                   {item.type === 'theory' ? (
                      <div className="space-y-2">
                         <h3 className="font-black text-gray-800 text-base uppercase tracking-tighter italic leading-none">{item.title}</h3>
                         <div className="bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-white/60 text-gray-600 prose prose-xs max-w-none line-clamp-3 italic">
                             <RichTextRenderer content={item.content} />
                         </div>
                      </div>
                   ) : (
                      <div className="space-y-3">
                         <h3 className="font-black text-gray-700 text-sm leading-relaxed uppercase italic tracking-tight"><RichTextRenderer content={item.statement} /></h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {item.options.map((opt, i) => (
                               <div key={i} className={clsx("text-[10px] p-2 rounded-xl border-2 flex items-center gap-2 transition-all", i === item.correct_option ? "bg-emerald-50 border-emerald-100 text-emerald-800 font-black shadow-sm" : "bg-gray-50/50 border-transparent text-gray-400 italic")}>
                                  <span className={clsx("w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black border-2 shrink-0", i === item.correct_option ? "bg-emerald-100 border-emerald-200 text-emerald-600" : "bg-white border-gray-100 text-gray-300")}>
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  <span className="truncate"><RichTextRenderer content={opt} /></span>
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
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-3xl border-4 border-white animate-in zoom-in-95 duration-200 relative custom-scrollbar flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter italic leading-none">
                     {editingId ? 'Editar Teoria' : 'Fundar Tópico'}
                  </h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-1 italic">Módulo de Transmissão Teórica</p>
                </div>
                <button onClick={() => setIsTheoryModalOpen(false)} className="bg-gray-100 text-gray-400 p-2 rounded-full hover:bg-gray-200 transition-all">
                   <X size={20} />
                </button>
            </div>
            
            <form onSubmit={handleSaveTheory} className="relative z-10 flex-1 flex flex-col gap-6">
                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título do Tópico</label>
                        <input 
                            required 
                            value={theoryForm.title} 
                            onChange={e => setTheoryForm({...theoryForm, title: e.target.value})}
                            placeholder="Ex: Introdução à Cinemática" 
                            className="w-full p-3.5 bg-gray-50 border-2 border-transparent focus:border-violet-500 focus:bg-white rounded-xl outline-none font-black text-lg text-gray-800 transition-all shadow-inner italic" 
                         />
                    </div>
                    
                    <LiveInput 
                       label="Conteúdo da Teoria"
                       required
                       value={theoryForm.content}
                       onChange={v => setTheoryForm({...theoryForm, content: v})}
                       height="h-[400px]"
                       placeholder="# Use Markdown e LaTeX..."
                    />
                </div>

                <div className="flex gap-4 pt-6 mt-auto">
                   <button type="submit" className="flex-1 py-4 bg-violet-600 text-white rounded-xl font-black text-base shadow-xl shadow-violet-500/20 hover:bg-violet-700 transition-all active:scale-[0.98] uppercase tracking-tighter">
                      {editingId ? 'Atualizar Conhecimento' : 'Imortalizar Teoria'}
                   </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL QUESTÃO --- */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-3xl border-4 border-white animate-in zoom-in-95 duration-200 relative custom-scrollbar flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                   <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter italic leading-none">
                     {editingId ? 'Editar Desafio' : 'Forjar Questão'}
                   </h2>
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-1 italic">Avaliação de Performance</p>
                </div>
                <button onClick={() => setIsQuestionModalOpen(false)} className="bg-gray-100 text-gray-400 p-2 rounded-full hover:bg-gray-200 transition-all">
                   <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="relative z-10 flex-1 flex flex-col gap-6">
               <div className="flex-1 space-y-8">
                  
                  <LiveInput 
                      label="Enunciado da Questão"
                      required
                      value={questionForm.statement}
                      onChange={v => setQuestionForm({...questionForm, statement: v})}
                      height="h-32"
                  />

                  <div className="space-y-4">
                      <div className="flex justify-between items-center px-1 border-b-2 border-gray-50 pb-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alternativas de Resposta</label>
                          <button 
                            type="button" 
                            onClick={handleAddOption} 
                            disabled={questionForm.options.length >= 5}
                            className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 disabled:opacity-50 transition-all"
                          >+ Adicionar</button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                          {questionForm.options.map((opt, i) => (
                             <div key={i} className="flex gap-4 items-start group relative">
                                <div className="pt-2 flex flex-col items-center gap-2">
                                   <div className={clsx(
                                       "w-8 h-8 rounded-xl font-black flex items-center justify-center text-sm shadow-sm border-2 transition-all",
                                       questionForm.correctOption === i ? "bg-emerald-500 border-emerald-400 text-white" : "bg-gray-100 border-transparent text-gray-400"
                                   )}>
                                      {String.fromCharCode(65 + i)}
                                   </div>
                                   <input 
                                     type="radio" 
                                     name="correctOption" 
                                     checked={questionForm.correctOption === i} 
                                     onChange={() => setQuestionForm({...questionForm, correctOption: i})}
                                     className="w-4 h-4 accent-emerald-500 cursor-pointer"
                                     title="Marcar como correta"
                                   />
                                </div>
                                
                                <div className="flex-1">
                                    <LiveInput 
                                        label={`Opção ${String.fromCharCode(65 + i)} ${questionForm.correctOption === i ? '✓ GABARITO' : ''}`}
                                        value={opt}
                                        onChange={(v) => handleOptionChange(i, v)}
                                        height="h-20"
                                        required
                                        placeholder={`Explique aqui...`}
                                    />
                                </div>

                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveOption(i)} 
                                  className="mt-6 p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                  title="Remover opção"
                                >
                                    <Trash2 size={16} />
                                </button>
                             </div>
                          ))}
                      </div>
                  </div>

                  <div className="bg-blue-50/30 p-5 rounded-[2rem] border-2 border-blue-50 shadow-inner">
                      <LiveInput 
                          label="Solução Detalhada (Opcional)"
                          value={questionForm.explanation}
                          onChange={v => setQuestionForm({...questionForm, explanation: v})}
                          height="h-24"
                          placeholder="Aparecerá após a resposta do aluno..."
                      />
                  </div>

               </div>

               <div className="flex gap-4 pt-4 mt-auto">
                  <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black text-base shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-[0.98] uppercase tracking-tighter">
                    {editingId ? 'Confirmar Alterações' : 'Publicar no Sistema'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLearningQuestionsPage;
