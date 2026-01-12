import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LearningPage from './pages/LearningPage';
import PracticePathPage from './pages/PracticePathPage';
import PracticeQuizPage from './pages/PracticeQuizPage';
import PracticeSectionsPage from './pages/PracticeSectionsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { useAuthStore } from './stores/useAuthStore';
import OfflineIndicator from './components/OfflineIndicator';
import SupabaseAuthTest from './pages/SupabaseAuthTest';

// Lazy load páginas secundárias para reduzir bundle inicial
const DisciplinesPage = lazy(() => import('./pages/DisciplinesPage'));
const DisciplineExamsPage = lazy(() => import('./pages/DisciplineExamsPage'));
const StudyPage = lazy(() => import('./pages/StudyPage'));
const ChallengeSelectDisciplinePage = lazy(() => import('./pages/ChallengeSelectDisciplinePage'));
const ChallengePage = lazy(() => import('./pages/ChallengePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RankingPage = lazy(() => import('./pages/RankingPage'));
const DownloadsPage = lazy(() => import('./pages/DownloadsPage'));
const StudyPlanSetupPage = lazy(() => import('./pages/StudyPlanSetupPage'));
const SimulationConfigPage = lazy(() => import('./pages/SimulationConfigPage'));
const SimulationPage = lazy(() => import('./pages/SimulationPage'));
const SimulationResultPage = lazy(() => import('./pages/SimulationResultPage'));
const SimulationHistoryPage = lazy(() => import('./pages/SimulationHistoryPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const GroupChatPage = lazy(() => import('./pages/GroupChatPage'));

// Lazy load TODAS as páginas admin (raramente acessadas)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminExamsPage = lazy(() => import('./pages/admin/AdminExamsPage'));
const AdminExamEditorPage = lazy(() => import('./pages/admin/AdminExamEditorPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminGroupsPage = lazy(() => import('./pages/admin/AdminGroupsPage'));
const AdminDownloadsPage = lazy(() => import('./pages/admin/AdminDownloadsPage'));
const AdminUniversitiesPage = lazy(() => import('./pages/admin/AdminUniversitiesPage'));
const AdminLearningPage = lazy(() => import('./pages/admin/AdminLearningPage'));
const AdminLearningSectionsPage = lazy(() => import('./pages/admin/AdminLearningSectionsPage'));
const AdminLearningSessionsPage = lazy(() => import('./pages/admin/AdminLearningSessionsPage'));
const AdminLearningQuestionsPage = lazy(() => import('./pages/admin/AdminLearningQuestionsPage'));
const AdminDisciplinesPage = lazy(() => import('./pages/admin/AdminDisciplinesPage'));
const AdminBulkImportPage = lazy(() => import('./pages/admin/AdminBulkImportPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
  </div>
);


function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
    
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, [initAuth]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <OfflineIndicator />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Página de Teste Supabase */}
          <Route path="/supabase-test" element={<SupabaseAuthTest />} />
          
          <Route element={<Layout />}>
            <Route path="/disciplines" element={
              <ProtectedRoute>
                <DisciplinesPage />
              </ProtectedRoute>
            } />
            <Route path="/learning" element={
              <ProtectedRoute>
                <LearningPage />
              </ProtectedRoute>
            } />
          <Route path="/disciplines/:disciplineId/exams" element={
            <ProtectedRoute>
              <DisciplineExamsPage mode="study" />
            </ProtectedRoute>
          } />
          <Route path="/challenge/select-exam/:disciplineId" element={
            <ProtectedRoute>
              <DisciplineExamsPage mode="challenge" />
            </ProtectedRoute>
          } />
          <Route path="/challenge/start/:examId" element={
            <ProtectedRoute>
              <ChallengePage />
            </ProtectedRoute>
          } />
          
          <Route path="/challenge" element={
            <ProtectedRoute>
              <ChallengeSelectDisciplinePage />
            </ProtectedRoute>
          } />
          
          <Route path="/challenge/select-discipline" element={
            <Navigate to="/challenge" replace />
          } />

          <Route path="/study/:examId" element={
            <ProtectedRoute>
              <StudyPage />
            </ProtectedRoute>
          } />


          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/study-plan/setup" element={
            <ProtectedRoute>
              <StudyPlanSetupPage />
            </ProtectedRoute>
          } />

          <Route path="/simulation/config" element={
            <ProtectedRoute>
              <SimulationConfigPage />
            </ProtectedRoute>
          } />
          <Route path="/simulation/start" element={
            <ProtectedRoute>
              <SimulationPage />
            </ProtectedRoute>
          } />
          <Route path="/simulation/result" element={
            <ProtectedRoute>
              <SimulationResultPage />
            </ProtectedRoute>
          } />
          <Route path="/simulation/history" element={
            <ProtectedRoute>
              <SimulationHistoryPage />
            </ProtectedRoute>
          } />

          <Route path="/groups" element={
            <ProtectedRoute>
              <GroupsPage />
            </ProtectedRoute>
          } />
          <Route path="/groups/:groupId" element={
            <ProtectedRoute>
              <GroupChatPage />
            </ProtectedRoute>
          } />
          
          <Route path="/ranking" element={
            <ProtectedRoute>
              <RankingPage />
            </ProtectedRoute>
          } />
          
          <Route path="/practice/:disciplineId" element={
            <ProtectedRoute>
              <PracticeSectionsPage />
            </ProtectedRoute>
          } />
          <Route path="/practice/:disciplineId/section/:sectionId" element={
            <ProtectedRoute>
              <PracticePathPage />
            </ProtectedRoute>
          } />
          <Route path="/practice/:disciplineId/section/:sectionId/session/:sessionId" element={
            <ProtectedRoute>
              <PracticeQuizPage />
            </ProtectedRoute>
          } />
          <Route path="/practice/:disciplineId/session/:sessionId" element={
            <ProtectedRoute>
              <PracticeQuizPage />
            </ProtectedRoute>
          } />
          
          <Route path="/downloads" element={
            <ProtectedRoute>
              <DownloadsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/exams" element={
            <AdminRoute>
              <AdminExamsPage />
            </AdminRoute>
          } />
          <Route path="/admin/exams/create" element={
            <AdminRoute>
              <AdminExamEditorPage />
            </AdminRoute>
          } />
          <Route path="/admin/exams/:examId/edit" element={
            <AdminRoute>
              <AdminExamEditorPage />
            </AdminRoute>
          } />
          <Route path="/admin/exams/bulk-import" element={
            <AdminRoute>
              <AdminBulkImportPage />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          } />
          <Route path="/admin/groups" element={
            <AdminRoute>
              <AdminGroupsPage />
            </AdminRoute>
          } />
          <Route path="/admin/downloads" element={
            <AdminRoute>
              <AdminDownloadsPage />
            </AdminRoute>
          } />
          <Route path="/admin/universities" element={
            <AdminRoute>
              <AdminUniversitiesPage />
            </AdminRoute>
          } />
          <Route path="/admin/disciplines" element={
            <AdminRoute>
              <AdminDisciplinesPage />
            </AdminRoute>
          } />
       
          <Route path="/admin/learning" element={
            <AdminRoute>
              <AdminLearningPage />
            </AdminRoute>
          } />
          <Route path="/admin/learning/:disciplineId/sessions" element={
            <AdminRoute>
              <AdminLearningSessionsPage />
            </AdminRoute>
          } />
          <Route path="/admin/learning/:disciplineId/sessions/:sessionId/questions" element={
            <AdminRoute>
              <AdminLearningQuestionsPage />
            </AdminRoute>
          } />
          
          <Route path="/admin/learning/:disciplineId/sections" element={
            <AdminRoute>
              <AdminLearningSectionsPage />
            </AdminRoute>
          } />
           <Route path="/admin/learning/:disciplineId/sections/:sectionId/sessions" element={
            <AdminRoute>
              <AdminLearningSessionsPage />
            </AdminRoute>
          } />
           <Route path="/admin/learning/:disciplineId/sections/:sectionId/sessions/:sessionId/questions" element={
            <AdminRoute>
              <AdminLearningQuestionsPage />
            </AdminRoute>
          } />
          
        </Route>
      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
