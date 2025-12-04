import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DisciplinesPage from './pages/DisciplinesPage';
import DisciplineExamsPage from './pages/DisciplineExamsPage';
import StudyPage from './pages/StudyPage';
import ChallengeSelectDisciplinePage from './pages/ChallengeSelectDisciplinePage';
import ChallengePage from './pages/ChallengePage';
import ProfilePage from './pages/ProfilePage';
import RankingPage from './pages/RankingPage';
import DownloadsPage from './pages/DownloadsPage';
import StudyPlanSetupPage from './pages/StudyPlanSetupPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminExamsPage from './pages/admin/AdminExamsPage';
import AdminExamEditorPage from './pages/admin/AdminExamEditorPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminVideosPage from './pages/admin/AdminVideosPage';
import AdminABTestsPage from './pages/admin/AdminABTestsPage';
import AdminABTestEditorPage from './pages/admin/AdminABTestEditorPage';
import VideoLessonsPage from './pages/VideoLessonsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { useAuthStore } from './stores/useAuthStore';

import OfflineIndicator from './components/OfflineIndicator';

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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route element={<Layout />}>
          <Route path="/disciplines" element={
            <ProtectedRoute>
              <DisciplinesPage />
            </ProtectedRoute>
          } />
          <Route path="/lessons" element={
            <ProtectedRoute>
              <VideoLessonsPage />
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
          
          <Route path="/ranking" element={
            <ProtectedRoute>
              <RankingPage />
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
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          } />
          <Route path="/admin/videos" element={
            <AdminRoute>
              <AdminVideosPage />
            </AdminRoute>
          } />
          <Route path="/admin/ab-tests" element={
            <AdminRoute>
              <AdminABTestsPage />
            </AdminRoute>
          } />
          <Route path="/admin/ab-tests/new" element={
            <AdminRoute>
              <AdminABTestEditorPage />
            </AdminRoute>
          } />
          <Route path="/admin/ab-tests/edit/:testId" element={
            <AdminRoute>
              <AdminABTestEditorPage />
            </AdminRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
