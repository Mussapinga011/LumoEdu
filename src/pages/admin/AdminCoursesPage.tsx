import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Search, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  GraduationCap,
  BookOpen,
  Clock,
  Target
} from 'lucide-react';
import clsx from 'clsx';

interface CourseRequirement {
  id: string;
  university_id: string;
  course_name: string;
  disciplines: Array<{
    disciplineId: string;
    disciplineName: string;
    weight: number;
    isRequired: boolean;
  }>;
  minimum_score: number;
  estimated_study_hours: number;
  created_at?: string;
  updated_at?: string;
}

interface University {
  id: string;
  name: string;
  short_name: string;
}

interface Discipline {
  id: string;
  title: string;
}

const AdminCoursesPage = () => {
  const [courses, setCourses] = useState<CourseRequirement[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CourseRequirement | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [courseName, setCourseName] = useState('');
  const [minimumScore, setMinimumScore] = useState(12);
  const [studyHours, setStudyHours] = useState(300);
  const [selectedDisciplines, setSelectedDisciplines] = useState<Array<{
    disciplineId: string;
    weight: number;
    isRequired: boolean;
  }>>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar cursos
      const { data: coursesData, error: coursesError } = await supabase
        .from('course_requirements')
        .select('*')
        .order('course_name');
      
      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // Buscar universidades
      const { data: unisData, error: unisError } = await supabase
        .from('universities')
        .select('*')
        .order('short_name');
      
      if (unisError) throw unisError;
      setUniversities(unisData || []);

      // Buscar disciplinas
      const { data: discsData, error: discsError } = await supabase
        .from('disciplines')
        .select('*')
        .eq('is_active', true)
        .order('title');
      
      if (discsError) throw discsError;
      setDisciplines(discsData || []);

    } catch (err: any) {
      console.error('Error loading data:', err);
      setToast({ 
        message: `Falha ao carregar dados: ${err.message || 'Erro de conexão'}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const openModal = (course?: CourseRequirement) => {
    if (course) {
      setEditingItem(course);
      setSelectedUniversity(course.university_id);
      setCourseName(course.course_name);
      setMinimumScore(course.minimum_score);
      setStudyHours(course.estimated_study_hours);
      setSelectedDisciplines(course.disciplines.map(d => ({
        disciplineId: d.disciplineId,
        weight: d.weight,
        isRequired: d.isRequired
      })));
    } else {
      setEditingItem(null);
      setSelectedUniversity('');
      setCourseName('');
      setMinimumScore(12);
      setStudyHours(300);
      setSelectedDisciplines([]);
    }
    setIsModalOpen(true);
  };

  const toggleDiscipline = (discId: string) => {
    const exists = selectedDisciplines.find(d => d.disciplineId === discId);
    if (exists) {
      setSelectedDisciplines(prev => prev.filter(d => d.disciplineId !== discId));
    } else {
      setSelectedDisciplines(prev => [...prev, {
        disciplineId: discId,
        weight: 0.25,
        isRequired: true
      }]);
    }
  };

  const updateDisciplineWeight = (discId: string, weight: number) => {
    setSelectedDisciplines(prev => prev.map(d => 
      d.disciplineId === discId ? { ...d, weight } : d
    ));
  };

  const toggleDisciplineRequired = (discId: string) => {
    setSelectedDisciplines(prev => prev.map(d => 
      d.disciplineId === discId ? { ...d, isRequired: !d.isRequired } : d
    ));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (!selectedUniversity || !courseName || selectedDisciplines.length === 0) {
      setToast({ message: 'Preencha todos os campos e selecione pelo menos uma disciplina.', type: 'error' });
      setSaving(false);
      return;
    }

    // Validar soma dos pesos
    const totalWeight = selectedDisciplines.reduce((sum, d) => sum + d.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      setToast({ message: `A soma dos pesos deve ser 1.0 (atual: ${totalWeight.toFixed(2)})`, type: 'error' });
      setSaving(false);
      return;
    }

    try {
      const disciplinesWithNames = selectedDisciplines.map(sd => {
        const disc = disciplines.find(d => d.id === sd.disciplineId);
        return {
          disciplineId: sd.disciplineId,
          disciplineName: disc?.title || 'Desconhecida',
          weight: sd.weight,
          isRequired: sd.isRequired
        };
      });

      const courseData = {
        university_id: selectedUniversity,
        course_name: courseName,
        disciplines: disciplinesWithNames,
        minimum_score: minimumScore,
        estimated_study_hours: studyHours
      };

      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('course_requirements')
          .update(courseData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        setToast({ message: 'Curso atualizado com sucesso!', type: 'success' });
      } else {
        // Insert
        const { error } = await supabase
          .from('course_requirements')
          .insert(courseData);
        
        if (error) throw error;
        setToast({ message: 'Curso cadastrado com sucesso!', type: 'success' });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      setToast({ message: error.message || 'Erro ao salvar curso', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { error } = await supabase
        .from('course_requirements')
        .delete()
        .eq('id', deleteConfirm.id);
      
      if (error) throw error;
      setToast({ message: `O curso "${deleteConfirm.name}" foi removido.`, type: 'success' });
      fetchData();
    } catch (error: any) {
      setToast({ message: 'Erro ao excluir curso.', type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar cursos por universidade
  const coursesByUniversity = filteredCourses.reduce((acc, course) => {
    const uni = universities.find(u => u.id === course.university_id);
    const uniName = uni?.short_name || 'Outra';
    if (!acc[uniName]) acc[uniName] = [];
    acc[uniName].push(course);
    return acc;
  }, {} as Record<string, CourseRequirement[]>);

  if (loading && courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-xs">Carregando Cursos...</p>
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
          toast.type === 'success' ? 'bg-white/90 border-blue-500' : 'bg-white/90 border-blue-500'
        )}>
          <div className={clsx(
            "p-2.5 rounded-xl shrink-0",
            toast.type === 'error' ? 'bg-red-100 text-red-600' : 
            toast.type === 'success' ? 'bg-blue-100 text-blue-600' : 'bg-blue-100 text-blue-600'
          )}>
            {toast.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-gray-800 text-lg leading-tight uppercase tracking-tighter">
              {toast.type === 'error' ? 'Erro' : 'Sucesso'}
            </h3>
            <p className="text-gray-600 text-sm font-medium mt-1 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-950 p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-blue-300 text-xs font-black uppercase tracking-[0.2em] mb-4 border border-white/10">
              <Shield size={14} /> Requisitos Acadêmicos
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-none uppercase italic">
              GESTÃO DE <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent italic">CURSOS</span>
            </h1>
            <p className="text-blue-100/70 font-medium max-w-md text-lg italic leading-tight">
              Configure os requisitos de admissão, disciplinas obrigatórias e pesos para cada curso universitário.
            </p>
          </div>
          
          <div className="flex flex-col gap-6 w-full md:w-auto">
            <button 
              onClick={() => openModal()} 
              className="flex items-center justify-center gap-3 bg-white text-blue-950 px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-xl shadow-white/10 active:scale-95 group uppercase"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" /> 
              NOVO CURSO
            </button>
            <div className="flex items-center justify-center md:justify-end gap-8 text-blue-200/50">
              <div className="text-center">
                <div className="text-3xl font-black text-white italic">{courses.length}</div>
                <div className="text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Cadastrados</div>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-white italic">{universities.length}</div>
                <div className="text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Universidades</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome do curso..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 rounded-[1.5rem] py-5 pl-14 pr-6 font-bold text-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm italic"
          />
        </div>
      </div>

      {/* Courses Grid (Grouped by University) */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-gray-200 animate-in fade-in zoom-in-95">
          <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={48} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter italic">Nenhum curso encontrado</h2>
          <p className="text-gray-400 font-medium mt-2 italic">Adicione um novo curso ou ajuste sua busca.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(coursesByUniversity).map(([uniName, uniCourses]) => (
            <div key={uniName}>
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="text-blue-500" size={24} />
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter italic">{uniName}</h2>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uniCourses.map((course) => (
                  <div key={course.id} className="group bg-white rounded-[2rem] p-6 border-2 border-gray-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                    
                    {/* Pattern Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
                    
                    <h3 className="text-xl font-black text-gray-800 mb-4 leading-tight uppercase tracking-tighter line-clamp-2 italic relative z-10">
                      {course.course_name}
                    </h3>
                    
                    {/* Disciplines */}
                    <div className="space-y-2 mb-4 relative z-10">
                      {course.disciplines.slice(0, 3).map((disc, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-medium">{disc.disciplineName}</span>
                          <span className="text-blue-600 font-black">{(disc.weight * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                      {course.disciplines.length > 3 && (
                        <p className="text-xs text-gray-400 italic">+{course.disciplines.length - 3} mais...</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-6 text-xs text-gray-500 relative z-10">
                      <div className="flex items-center gap-1">
                        <Target size={14} />
                        <span className="font-bold">{course.minimum_score} pts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span className="font-bold">{course.estimated_study_hours}h</span>
                      </div>
                    </div>
                    
                    {/* Footer Actions */}
                    <div className="flex gap-2 relative z-10">
                      <button 
                        onClick={() => openModal(course)} 
                        className="flex-1 p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm font-bold text-sm"
                      >
                        <Edit2 size={16} className="inline mr-1" /> Editar
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm({ id: course.id, name: course.course_name })} 
                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-10 md:p-12 w-full max-w-2xl shadow-3xl border-4 border-white animate-in zoom-in-95 duration-200 relative my-8">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black tracking-tighter uppercase italic text-gray-800">
                  {editingItem ? 'Editar' : 'Novo'} Curso
                </h2>
                <p className="text-blue-500 font-bold uppercase tracking-widest text-[10px] mt-1 italic">Requisitos de Admissão</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-400 p-3 rounded-full hover:bg-red-50 hover:text-red-500 transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Universidade */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Universidade</label>
                <select 
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  required
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-2xl font-bold text-gray-800 transition-all italic text-lg shadow-inner"
                >
                  <option value="">Selecione...</option>
                  {universities.map(uni => (
                    <option key={uni.id} value={uni.id}>{uni.short_name} - {uni.name}</option>
                  ))}
                </select>
              </div>

              {/* Nome do Curso */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Curso</label>
                <input 
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  required
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-2xl font-bold text-gray-800 transition-all italic text-lg shadow-inner"
                  placeholder="Ex: Engenharia Informática"
                />
              </div>

              {/* Nota Mínima e Horas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Nota Mínima</label>
                  <input 
                    type="number"
                    value={minimumScore}
                    onChange={(e) => setMinimumScore(parseInt(e.target.value))}
                    min="10"
                    max="20"
                    required
                    className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-2xl font-black text-center text-3xl text-blue-600 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Horas Estimadas</label>
                  <input 
                    type="number"
                    value={studyHours}
                    onChange={(e) => setStudyHours(parseInt(e.target.value))}
                    min="50"
                    step="50"
                    required
                    className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-2xl font-black text-center text-3xl text-blue-600 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Disciplinas */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Disciplinas e Pesos</label>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 max-h-64 overflow-y-auto">
                  {disciplines.map(disc => {
                    const selected = selectedDisciplines.find(d => d.disciplineId === disc.id);
                    return (
                      <div key={disc.id} className={clsx(
                        "p-4 rounded-xl border-2 transition-all",
                        selected ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input 
                              type="checkbox"
                              checked={!!selected}
                              onChange={() => toggleDiscipline(disc.id)}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="font-bold text-gray-800">{disc.title}</span>
                          </label>
                          {selected && (
                            <button
                              type="button"
                              onClick={() => toggleDisciplineRequired(disc.id)}
                              className={clsx(
                                "px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all",
                                selected.isRequired 
                                  ? "bg-blue-600 text-white" 
                                  : "bg-gray-200 text-gray-600"
                              )}
                            >
                              {selected.isRequired ? 'Obrigatória' : 'Opcional'}
                            </button>
                          )}
                        </div>
                        {selected && (
                          <div className="flex items-center gap-3 mt-2">
                            <label className="text-xs font-bold text-gray-500">Peso:</label>
                            <input 
                              type="number"
                              value={selected.weight}
                              onChange={(e) => updateDisciplineWeight(disc.id, parseFloat(e.target.value))}
                              min="0"
                              max="1"
                              step="0.05"
                              className="flex-1 p-2 bg-white border-2 border-gray-200 rounded-lg font-bold text-center text-blue-600 focus:border-blue-500 outline-none"
                            />
                            <span className="text-sm font-bold text-gray-600">{(selected.weight * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedDisciplines.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <span className="text-sm font-bold text-gray-600">Soma dos Pesos:</span>
                    <span className={clsx(
                      "text-2xl font-black",
                      Math.abs(selectedDisciplines.reduce((sum, d) => sum + d.weight, 0) - 1.0) < 0.01
                        ? "text-green-600"
                        : "text-red-600"
                    )}>
                      {(selectedDisciplines.reduce((sum, d) => sum + d.weight, 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3 mt-10">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl shadow-xl shadow-blue-200 active:scale-95 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                  {editingItem ? 'ATUALIZAR' : 'CADASTRAR'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full py-2 font-black text-gray-400 uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors italic"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex items-center justify-center z-[130] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] p-12 w-full max-w-md text-center shadow-3xl border-4 border-red-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 rotate-12 shadow-lg shadow-red-100 flex-none ring-4 ring-white">
              <Trash2 size={48} />
            </div>
            
            <h2 className="text-4xl font-black text-gray-800 mb-4 tracking-tighter uppercase italic">Remover Curso?</h2>
            <p className="text-gray-500 font-medium mb-10 text-lg leading-relaxed italic">
              O curso <span className="text-gray-800 font-black">"{deleteConfirm.name}"</span> será removido permanentemente.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete} 
                className="w-full bg-red-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-red-200 active:scale-95 transition-all uppercase tracking-tighter"
              >
                SIM, REMOVER AGORA
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="w-full py-4 font-black text-gray-400 uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors italic"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoursesPage;
