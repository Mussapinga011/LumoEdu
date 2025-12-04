import { useState, useEffect } from 'react';
// Force update
import { useParams, useNavigate } from 'react-router-dom';
import { getExamsByDiscipline } from '../services/dbService';
import { Exam } from '../types/exam';
import { useContentStore } from '../stores/useContentStore';
import { ArrowLeft, FileText, Calendar, HelpCircle } from 'lucide-react';
import clsx from 'clsx';

interface DisciplineExamsPageProps {
  mode?: 'study' | 'challenge';
}

const DisciplineExamsPage = ({ mode = 'study' }: DisciplineExamsPageProps) => {
  const { disciplineId } = useParams();
  const navigate = useNavigate();
  const { disciplines } = useContentStore();
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const discipline = disciplines.find(d => d.id === disciplineId);

  useEffect(() => {
    if (disciplineId) {
      fetchExams(disciplineId);
    }
  }, [disciplineId]);



  const fetchExams = async (id: string) => {
    setLoading(true);
    try {
      const data = await getExamsByDiscipline(id);
      setExams(data);
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamClick = (examId: string) => {
    if (mode === 'challenge') {
      navigate(`/challenge/start/${examId}`);
    } else {
      navigate(`/study/${examId}`);
    }
  };



  if (!discipline) {
    return <div className="p-8 text-center">Discipline not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(mode === 'challenge' ? '/challenge/select-discipline' : '/disciplines')} 
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-2xl", discipline.color)}>
            {discipline.icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {mode === 'challenge' ? 'Select Exam for Challenge' : `${discipline.title} Exams`}
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Exams Available</h3>
          <p className="text-gray-500">There are no exams available for this discipline yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-secondary hover:shadow-md transition-all text-left group cursor-default"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-secondary transition-colors">
                {exam.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{exam.year} - {exam.season}</span>
                </div>
                <div className="flex items-center gap-1">
                  <HelpCircle size={16} />
                  <span>{exam.questionsCount} Questions</span>
                </div>
              </div>
              <button
                onClick={() => handleExamClick(exam.id)}
                className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors mt-4"
              >
                {mode === 'challenge' ? 'Start Challenge' : 'Practice Mode'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisciplineExamsPage;
