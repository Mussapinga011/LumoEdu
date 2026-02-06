import { useState, useEffect, useCallback } from 'react';
import { 
  getAllDownloads, 
  createDownloadMaterial, 
  updateDownloadMaterial, 
  deleteDownloadMaterial 
} from '../../services/dbService.supabase';
import { DownloadMaterial } from '../../types/download';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Link as LinkIcon, 
  FileText, 
  ExternalLink, 
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
  Calendar,
  Shield,
  Loader2,
  FileDown,
  MonitorPlay,
  FileBadge
} from 'lucide-react';
import { useContentStore } from '../../stores/useContentStore';
import clsx from 'clsx';

const AdminDownloadsPage = () => {
  const [downloads, setDownloads] = useState<DownloadMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const { disciplines, universities, fetchContent } = useContentStore();

  const [formData, setFormData] = useState<Omit<DownloadMaterial, 'id' | 'downloadCount' | 'createdAt'>>({
    title: '',
    description: '',
    fileUrl: '',
    fileSize: '',
    type: 'exam',
    disciplineId: '',
    disciplineName: '',
    universityId: 'all',
    universityName: 'Geral',
    year: new Date().getFullYear(),
    isPremium: false
  });

  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllDownloads();
      setDownloads(data);
    } catch (error: any) {
      console.error('Error fetching downloads:', error);
      setToast({ 
        message: `Erro ao carregar materiais: ${error.message || 'Falha na conexão'}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchContent();
  }, [fetchData, fetchContent]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      fileUrl: '',
      fileSize: '',
      type: 'exam',
      disciplineId: '',
      disciplineName: '',
      universityId: 'all',
      universityName: 'Geral',
      year: new Date().getFullYear(),
      isPremium: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: DownloadMaterial) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || '',
      fileUrl: item.fileUrl,
      fileSize: item.fileSize || '',
      type: item.type,
      disciplineId: item.disciplineId,
      disciplineName: item.disciplineName,
      universityId: item.universityId,
      universityName: item.universityName || 'Geral',
      year: item.year || new Date().getFullYear(),
      isPremium: item.isPremium
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const discipline = disciplines.find(d => d.id === formData.disciplineId);
      if (!discipline) throw new Error('Selecione uma disciplina válida');

      const uni = universities.find(u => u.id === formData.universityId);
      const universityName = uni ? uni.shortName : 'Geral';

      const finalData = {
        ...formData,
        disciplineName: discipline.title,
        universityName
      };

      if (editingId) {
        await updateDownloadMaterial(editingId, finalData);
        setToast({ message: 'Material atualizado com sucesso!', type: 'success' });
      } else {
        await createDownloadMaterial(finalData);
        setToast({ message: 'Novo material cadastrado na biblioteca!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao processar arquivo', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDownloadMaterial(deleteConfirm.id);
      setToast({ message: 'Arquivo removido permanentemente.', type: 'success' });
      fetchData();
    } catch (error: any) {
      setToast({ message: 'Erro ao excluir material.', type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredDownloads = downloads.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.disciplineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.universityName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: downloads.length,
    exams: downloads.filter(d => d.type === 'exam').length,
    downloads: downloads.reduce((acc, d) => acc + (d.downloadCount || 0), 0)
  }

  if (loading && downloads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-xs">Sincronizando Biblioteca...</p>
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
            <h3 className="font-extrabold text-gray-800 text-lg leading-tight uppercase tracking-tighter">
              {toast.type === 'error' ? 'Falha no Sistema' : 
               toast.type === 'success' ? 'Operação Concluída' : 'Info'}
            </h3>
            <p className="text-gray-600 text-sm font-medium mt-1 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 p-6 md:p-8 rounded-[2rem] text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-primary-light text-[10px] font-black uppercase tracking-[0.15em] mb-3 border border-white/10">
              <Shield size={12} /> Repositório de Arquivos
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-3 leading-none uppercase italic">
              CENTRAL DE <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent italic">DOWNLOADS</span>
            </h1>
            <p className="text-blue-100/70 font-medium max-w-md text-sm italic">
              Organize provas, gabaritos e materiais complementares com foco em conversão e utilidade.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-auto">
            <button 
              onClick={handleOpenCreateModal} 
              className="flex items-center justify-center gap-2 bg-white text-indigo-950 px-6 py-3 rounded-xl font-black text-sm hover:bg-white/90 transition-all shadow-lg shadow-white/10 active:scale-95 group uppercase"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
              NOVO MATERIAL
            </button>
            <div className="flex items-center justify-center md:justify-end gap-6 text-indigo-200/50">
              <div className="text-center">
                <div className="text-2xl font-black text-white italic leading-none">{stats.total}</div>
                <div className="text-[9px] uppercase font-bold tracking-[0.15em] mt-0.5">Materiais</div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center">
                <div className="text-2xl font-black text-white italic leading-none">{stats.downloads}</div>
                <div className="text-[9px] uppercase font-bold tracking-[0.15em] mt-0.5">Baixados</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar por título ou disciplina..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none transition-all shadow-sm italic"
          />
        </div>
      </div>

      {/* List / Table */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 font-black text-gray-400 uppercase text-[9px] tracking-widest">Identidade do Arquivo</th>
                <th className="px-6 py-4 font-black text-gray-400 uppercase text-[9px] tracking-widest hidden md:table-cell">Ano/Info</th>
                <th className="px-6 py-4 font-black text-gray-400 uppercase text-[9px] tracking-widest">Categoria</th>
                <th className="px-6 py-4 font-black text-gray-400 uppercase text-[9px] tracking-widest">Status</th>
                <th className="px-6 py-4 text-right font-black text-gray-400 uppercase text-[9px] tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDownloads.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 duration-300",
                        item.type === 'exam' ? "bg-blue-100 text-blue-600 shadow-blue-100/20" : 
                        item.type === 'guide' ? "bg-purple-100 text-purple-600 shadow-purple-100/20" :
                        "bg-teal-100 text-teal-600 shadow-teal-100/20"
                      )}>
                        {item.type === 'exam' ? <FileText size={20} /> : 
                         item.type === 'guide' ? <MonitorPlay size={20} /> : <FileBadge size={20} />}
                      </div>
                      <div>
                        <div className="font-black text-gray-800 text-base leading-none uppercase tracking-tighter mb-1">{item.title}</div>
                        <div className="text-gray-400 font-bold text-[10px] line-clamp-1 italic">{item.description || 'Sem descrição'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                     <div className="flex items-center gap-1.5 text-gray-500 font-black text-[10px] uppercase italic">
                       <Calendar size={12} className="text-gray-400" />
                       {item.year}
                     </div>
                     <div className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-widest">{item.fileSize || '---'}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-black text-gray-700 uppercase tracking-tighter italic text-xs leading-none">{item.disciplineName}</div>
                    <div className="text-[9px] font-black text-primary uppercase opacity-60 tracking-widest mt-1 leading-none">{item.universityName}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={clsx(
                      "px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-[0.12em] border flex w-fit items-center gap-1",
                      item.isPremium ? "bg-amber-50 text-amber-600 border-amber-100 shadow-sm" : "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm"
                    )}>
                      {item.isPremium && <Shield size={8} />}
                      {item.isPremium ? 'PREMIUM' : 'GRATUITO'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-primary-light hover:text-white transition-all shadow-sm" title="Abrir"><ExternalLink size={16} /></a>
                      <button onClick={() => handleOpenEditModal(item)} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-secondary hover:text-white transition-all shadow-sm" title="Editar"><Edit size={16} /></button>
                      <button onClick={() => setDeleteConfirm({ id: item.id, title: item.title })} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Deletar"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-3xl border-4 border-white animate-in zoom-in-95 duration-200 relative custom-scrollbar">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-24 translate-x-24 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div>
                 <h2 className="text-2xl font-black tracking-tighter uppercase italic">{editingId ? 'Editar Registro' : 'Novo Arquivo'}</h2>
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-1 italic">Biblioteca de Download</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-500 p-2 rounded-full hover:bg-gray-200 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título do Documento</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    className="w-full p-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-primary focus:bg-white outline-none font-bold text-gray-800 transition-all italic text-base shadow-inner" 
                    placeholder="Ex: Prova de Matemática UEM 2024" 
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL da Fonte (Cloud)</label>
                  <div className="relative group">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      type="url" 
                      required 
                      value={formData.fileUrl} 
                      onChange={e => setFormData({...formData, fileUrl: e.target.value})} 
                      className="w-full pl-11 p-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-primary focus:bg-white outline-none font-bold text-gray-800 transition-all shadow-inner text-sm" 
                      placeholder="https://drive.google.com/..." 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instituição</label>
                  <select 
                    value={formData.universityId} 
                    onChange={e => setFormData({...formData, universityId: e.target.value})} 
                    className="w-full p-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-primary outline-none font-bold text-gray-800 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:18px] bg-[right_1rem_center] bg-no-repeat text-sm"
                  >
                    <option value="all">Foco Geral</option>
                    {universities.map(uni => <option key={uni.id} value={uni.id}>{uni.shortName}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplina Principal</label>
                  <select 
                    required 
                    value={formData.disciplineId} 
                    onChange={e => setFormData({...formData, disciplineId: e.target.value})} 
                    className="w-full p-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-primary outline-none font-bold text-gray-800 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:18px] bg-[right_1rem_center] bg-no-repeat text-sm"
                  >
                    <option value="">Selecione...</option>
                    {disciplines.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria de Arquivo</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as any})} 
                    className="w-full p-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-primary outline-none font-bold text-gray-800 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-[length:18px] bg-[right_1rem_center] bg-no-repeat text-sm"
                  >
                    <option value="exam">PROVA / EXAME</option>
                    <option value="guide">GUIA DE ESTUDO</option>
                    <option value="summary">RESUMÃO TEÓRICO</option>
                    <option value="other">OUTROS MATERIAIS</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ano de Referência</label>
                  <input type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} className="w-full p-3.5 bg-gray-50 rounded-xl border-2 border-transparent focus:border-primary outline-none font-bold text-gray-800 shadow-inner text-sm" />
                </div>

                <div className="md:col-span-2 flex items-center gap-4 bg-amber-50/50 p-4 rounded-2xl border-2 border-amber-100/50 group hover:border-amber-400 transition-all cursor-pointer" onClick={() => setFormData({...formData, isPremium: !formData.isPremium})}>
                  <div className={clsx(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-md",
                    formData.isPremium ? "bg-amber-500 text-white rotate-12" : "bg-gray-200 text-gray-400"
                  )}>
                    <Shield size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-amber-700 uppercase tracking-tighter italic text-xs">Bloqueio Premium ⭐</div>
                    <div className="text-[9px] text-amber-600/70 font-bold uppercase tracking-widest">Apenas assinantes poderão visualizar.</div>
                  </div>
                  <input type="checkbox" checked={formData.isPremium} readOnly className="w-5 h-5 rounded text-amber-500 border-amber-200 focus:ring-amber-500" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <FileDown size={20} />}
                  {editingId ? 'ATUALIZAR ARQUIVO' : 'LANÇAR MATÉRIA-PRIMA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex items-center justify-center z-[130] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-3xl border-4 border-red-50 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
            
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-12 shadow-lg shadow-red-100">
              <Trash2 size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-gray-800 mb-3 tracking-tighter uppercase italic">Expurgar Arquivo?</h2>
            <p className="text-gray-500 font-medium mb-8 text-base leading-relaxed italic">
              Este arquivo <span className="text-gray-800 font-black">"{deleteConfirm.title}"</span> será apagado do repositório.
            </p>
            
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={confirmDelete} 
                className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-red-200 active:scale-95 transition-all uppercase tracking-tighter"
              >
                Sim, Remover Permanentemente
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="w-full py-2 font-black text-gray-400 uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors"
              >
                Desistir e Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDownloadsPage;
