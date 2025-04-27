import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { EnvironmentsPage } from './pages/EnvironmentsPage';
import { EnvironmentCreatePage } from './pages/EnvironmentCreatePage';
import { EnvironmentGridEditorPage } from './pages/EnvironmentGridEditorPage';
import { EnvironmentDetailPage } from './pages/EnvironmentDetailPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { ScenarioCreatePage } from './pages/ScenarioCreatePage';
import { ScenarioDetailPage } from './pages/ScenarioDetailPage';
import { TasksPage } from './pages/TasksPage';
import { TaskCreatePage } from './pages/TaskCreatePage';
import { TaskGeneratePage } from './pages/TaskGeneratePage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { SolvesPage } from './pages/SolvesPage';
import { SolveCreatePage } from './pages/SolveCreatePage';
import { SolveDetailPage } from './pages/SolveDetailPage';
import { LandingPage } from './pages/LandingPage';
import { ProtectedRoute } from './components/layouts/ProtectedRoute';

function App() {
  const { fetchCurrentUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check for existing auth on app load
    if (isAuthenticated) {
      fetchCurrentUser();
    }
  }, [fetchCurrentUser, isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        {/* Environment routes */}
        <Route path="/environments" element={
          <ProtectedRoute>
            <EnvironmentsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/environments/create" element={
          <ProtectedRoute>
            <EnvironmentCreatePage />
          </ProtectedRoute>
        } />
        
        <Route path="/environments/grid-editor" element={
          <ProtectedRoute>
            <EnvironmentGridEditorPage />
          </ProtectedRoute>
        } />
        
        <Route path="/environments/:id" element={
          <ProtectedRoute>
            <EnvironmentDetailPage />
          </ProtectedRoute>
        } />
        
        {/* Scenario routes */}
        <Route path="/scenarios" element={
          <ProtectedRoute>
            <ScenariosPage />
          </ProtectedRoute>
        } />
        
        <Route path="/scenarios/create" element={
          <ProtectedRoute>
            <ScenarioCreatePage />
          </ProtectedRoute>
        } />
        
        <Route path="/scenarios/:id" element={
          <ProtectedRoute>
            <ScenarioDetailPage />
          </ProtectedRoute>
        } />
        
        {/* Task routes */}
        <Route path="/tasks" element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        } />
        
        <Route path="/tasks/create" element={
          <ProtectedRoute>
            <TaskCreatePage />
          </ProtectedRoute>
        } />
        
        <Route path="/tasks/generate" element={
          <ProtectedRoute>
            <TaskGeneratePage />
          </ProtectedRoute>
        } />
        
        <Route path="/tasks/:id" element={
          <ProtectedRoute>
            <TaskDetailPage />
          </ProtectedRoute>
        } />
        
        {/* Solve routes */}
        <Route path="/solves" element={
          <ProtectedRoute>
            <SolvesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/solves/create" element={
          <ProtectedRoute>
            <SolveCreatePage />
          </ProtectedRoute>
        } />
        
        <Route path="/solves/:id" element={
          <ProtectedRoute>
            <SolveDetailPage />
          </ProtectedRoute>
        } />
        
        {/* Redirect root to dashboard or login based on auth state */}
        <Route path="/" element={
          // isAuthenticated ? 
            // <Navigate to="/dashboard" replace /> : 
            <LandingPage />
        } />
        
        {/* Fallback route - 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-primary">404</h1>
              <p className="mt-4 text-2xl">Page not found</p>
              <button 
                onClick={() => window.history.back()}
                className="mt-6 btn btn-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
