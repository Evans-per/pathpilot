import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import RoadmapView from './pages/RoadmapView';
import VideoPlayer from './pages/VideoPlayer';
import Planner from './pages/Planner';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';
import Quiz from './pages/Quiz';
import Notes from './pages/Notes';
import Flashcards from './pages/Flashcards';


// Layout wrapper for authenticated dashboard views
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-darkbg transition-colors duration-300">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 md:pb-8 max-w-7xl">
          {children}
        </main>
      </div>
      <Chatbot />
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ONBOARDING QUESTIONNAIRE ROUTE (Requires authentication, but allows incomplete onboarding) */}
      <Route 
        path="/onboarding" 
        element={
          <ProtectedRoute allowIncompleteOnboarding={true}>
            <Onboarding />
          </ProtectedRoute>
        } 
      />

      {/* AUTH PROTECTED DASHBOARD ROUTES */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/roadmap" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <RoadmapView />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/planner" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Planner />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/videos" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <VideoPlayer />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leaderboard" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Leaderboard />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/quiz" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Quiz />
            </AppLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/notes" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Notes />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/flashcards" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Flashcards />
            </AppLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        } 
      />

      {/* Fallback to Dashboard if authenticated, else Landing */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
