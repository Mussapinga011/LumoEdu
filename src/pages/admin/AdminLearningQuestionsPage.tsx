import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getLearningQuestionsBySession, saveLearningQuestion, deleteLearningQuestion,
  getLearningSectionsBySession, saveLearningSection, deleteLearningSection
} from '../../services/contentService.supabase';
import { Plus, Edit2, Trash2, ArrowLeft, X, BookOpen, HelpCircle } from 'lucide-react';
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
        <label className="text-xs font-black text-gray-400 uppercase">{label} <span className="text-gray-300 font-normal normal-case">(Markdown/LaTeX suportado)</span></label>
        {required && <span className="text-red-400 text-xs font-bold">*Obrigatório</span>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <textarea 
          required={required}
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className={`w-full p-4 bg-gray-50 rounded-2xl font-mono text-sm font-medium outline-none border-2 border-transparent focus:border-primary focus:bg-white transition-all resize-y ${height}`}
          placeholder={placeholder || "Digite aqui... Use $$ formula $$ para LaTeX"}
      />
      <div className={`w-full p-4 bg-white rounded-2xl border-2 border-gray-100 overflow-x-auto overflow-y-auto ${height} prose prose-sm max-w-none`}>
          <div className="px-4 pb-4">
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
    options: ['', '', '', ''], // Default 4 opções
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
        // Garantir que options seja array
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
        statement: item.statement || item.question_text || '', // Fallback para nomes antigos
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
    // Validar opções vazias ou duplicadas se necessário
    const validOptions = questionForm.options.filter(o => o.trim() !== '');
    if (validOptions.length < 2) {
        alert("A questão precisa de pelo menos 2 alternativas válidas.");
        return;
    }
    
    // Se o índice correto estiver fora dos limites após filtrar, ajustar
    // (Mas aqui vamos salvar os inputs vazios? Melhor salvar como está no form para manter índice)
    
    const question = {
      id: editingId || crypto.randomUUID(),
      sessionId,
      statement: questionForm.statement,
      options: questionForm.options, // Salva o array (Supabase lida com array text[])
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
    // Ajustar correctOption se necessário
    let newCorrect = questionForm.correctOption;
    if (newCorrect === idx) newCorrect = 0; // Reset se removeu a correta
    else if (newCorrect > idx) newCorrect--; // Shift se removeu anterior

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

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-primary">CARREGANDO CONTEÚDO...</div>;

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-4 z-40 gap-4">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(`/admin/learning/${disciplineId}/sections/${sectionId}/sessions`)} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-primary hover:text-white transition-all"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tighter uppercase leading-none">Conteúdo da Aula</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-400 font-mono">{content.length} itens</span>
                <span className="text-gray-300 text-xs">ID: {sessionId?.slice(0, 8)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button onClick={() => openTheoryModal()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-2xl font-black hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 active:translate-y-1 text-sm uppercase">
             <Plus size={18} /> Teoria
           </button>
           <button onClick={() => openQuestionModal()} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:translate-y-1 text-sm uppercase">
             <Plus size={18} /> Questão
           </button>
        </div>
      </div>

      {/* Lista de Conteúdo */}
      <div className="space-y-6">
        {content.length === 0 ? (
           <div className="text-center py-24 bg-white rounded-[40px] border-4 border-dashed border-gray-100 items-center flex flex-col justify-center">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300"><Plus size={32} /></div>
               <p className="text-gray-400 font-bold text-lg">Nenhum conteúdo criado</p>
               <p className="text-gray-300 text-sm">Adicione teoria ou questões para começar.</p>
           </div>
        ) : content.map((item, idx) => (
          <div key={item.id} className={clsx("group relative p-8 rounded-[32px] border-2 shadow-sm hover:shadow-lg transition-all", item.type === 'theory' ? "bg-purple-50/20 border-purple-100 hover:border-purple-300" : "bg-white border-gray-100 hover:border-primary/50")}>
             
             {/* Ações */}
             <div className="absolute top-6 right-6 flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-mono text-gray-300 mr-2">#{idx + 1}</span>
                <button onClick={() => item.type === 'theory' ? openTheoryModal(item) : openQuestionModal(item)} className="p-2 bg-white text-gray-400 border border-gray-100 rounded-xl hover:text-blue-500 hover:border-blue-200 transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(item)} className="p-2 bg-white text-gray-400 border border-gray-100 rounded-xl hover:text-red-500 hover:border-red-200 transition-colors"><Trash2 size={16} /></button>
             </div>

             <div className="flex gap-6">
                <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2", item.type === 'theory' ? "bg-purple-100 border-purple-200 text-purple-600" : "bg-green-100 border-green-200 text-green-600")}>
                   {item.type === 'theory' ? <BookOpen size={24} /> : <HelpCircle size={24} />}
                </div>
                
                <div className="flex-1 min-w-0">
                   {item.type === 'theory' ? (
                      <div className="space-y-4">
                         <h3 className="font-black text-gray-800 text-xl">{item.title}</h3>
                         <div className="bg-white/50 p-4 rounded-2xl border border-dashed border-purple-200 text-gray-600 prose prose-sm max-w-none line-clamp-3">
                             <RichTextRenderer content={item.content} />
                         </div>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         <h3 className="font-bold text-gray-700 text-lg"><RichTextRenderer content={item.statement} /></h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.options.map((opt, i) => (
                               <div key={i} className={clsx("text-sm p-3 rounded-xl border flex items-center gap-3", i === item.correct_option ? "bg-green-50 border-green-200 text-green-800 font-bold shadow-sm" : "bg-white border-gray-100 text-gray-500")}>
                                  <span className={clsx("w-6 h-6 rounded flex items-center justify-center text-xs font-black border", i === item.correct_option ? "bg-green-200 border-green-300 text-green-700" : "bg-gray-50 border-gray-200 text-gray-400")}>
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
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-6">
          <div className="bg-white rounded-t-[40px] md:rounded-[40px] p-6 md:p-8 w-full max-w-4xl shadow-2xl border-4 border-white animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-800 uppercase flex items-center gap-3">
                    <span className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><BookOpen size={20}/></span>
                    {editingId ? 'Editar Teoria' : 'Nova Teoria'}
                </h2>
                <button onClick={() => setIsTheoryModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveTheory} className="flex-1 flex flex-col gap-6 overflow-hidden">
               <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                   <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase ml-2">Título do Tópico</label>
                       <input 
                           required 
                           value={theoryForm.title} 
                           onChange={e => setTheoryForm({...theoryForm, title: e.target.value})}
                           placeholder="Ex: Introdução à Cinemática" 
                           className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xl outline-none border-2 border-transparent focus:border-purple-500 focus:bg-white transition-all" 
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

               <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsTheoryModalOpen(false)} className="px-8 py-4 font-black text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-all">CANCELAR</button>
                  <button type="submit" className="flex-1 py-4 bg-purple-500 text-white rounded-2xl font-black shadow-lg shadow-purple-500/20 hover:bg-purple-600 transition-all transform active:scale-[0.98]">SALVAR TEORIA</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL QUESTÃO --- */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-6">
          <div className="bg-white rounded-t-[40px] md:rounded-[40px] p-6 md:p-8 w-full max-w-5xl shadow-2xl border-4 border-white animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 h-[95vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-800 uppercase flex items-center gap-3">
                    <span className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><HelpCircle size={20}/></span>
                    {editingId ? 'Editar Questão' : 'Nova Questão'}
                </h2>
                <button onClick={() => setIsQuestionModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveQuestion} className="flex-1 flex flex-col gap-6 overflow-hidden">
               <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
                  
                  {/* ENUNCIADO */}
                  <LiveInput 
                      label="Enunciado da Questão"
                      required
                      value={questionForm.statement}
                      onChange={v => setQuestionForm({...questionForm, statement: v})}
                      height="h-40"
                  />

                  {/* ALTERNATIVAS */}
                  <div className="space-y-4">
                      <div className="flex justify-between items-center px-2 border-b border-gray-100 pb-2">
                          <label className="text-xs font-black text-gray-400 uppercase">Alternativas ({questionForm.options.length})</label>
                          <button 
                            type="button" 
                            onClick={handleAddOption} 
                            disabled={questionForm.options.length >= 5}
                            className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50"
                          >+ Adicionar Opção</button>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                          {questionForm.options.map((opt, i) => (
                             <div key={i} className="flex gap-4 items-start group">
                                <div className="pt-4 flex flex-col items-center gap-2">
                                   <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 font-black flex items-center justify-center text-sm shadow-inner">{String.fromCharCode(65 + i)}</div>
                                   <input 
                                     type="radio" 
                                     name="correctOption" 
                                     checked={questionForm.correctOption === i} 
                                     onChange={() => setQuestionForm({...questionForm, correctOption: i})}
                                     className="w-5 h-5 accent-green-500 cursor-pointer"
                                     title="Marcar como correta"
                                   />
                                </div>
                                
                                <div className="flex-1">
                                    <LiveInput 
                                        label={`Opção ${String.fromCharCode(65 + i)} ${questionForm.correctOption === i ? '(CORRETA)' : ''}`}
                                        value={opt}
                                        onChange={(v) => handleOptionChange(i, v)}
                                        height="h-24"
                                        required
                                        placeholder={`Texto da alternativa ${String.fromCharCode(65 + i)}`}
                                    />
                                </div>

                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveOption(i)} 
                                  className="mt-8 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                  title="Remover opção"
                                >
                                    <Trash2 size={18} />
                                </button>
                             </div>
                          ))}
                      </div>
                  </div>

                  {/* EXPLICAÇÃO */}
                  <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                      <LiveInput 
                          label="Explicação da Resposta (Opcional)"
                          value={questionForm.explanation}
                          onChange={v => setQuestionForm({...questionForm, explanation: v})}
                          height="h-24"
                          placeholder="Aparecerá para o aluno após responder..."
                      />
                  </div>

               </div>

               <div className="flex gap-4 pt-4 border-t border-gray-100 bg-white z-10">
                  <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="px-8 py-4 font-black text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-all">CANCELAR</button>
                  <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all transform active:scale-[0.98]">SALVAR QUESTÃO</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLearningQuestionsPage;
