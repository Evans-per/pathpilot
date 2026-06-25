import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowIncompleteOnboarding = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkbg">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  // 1. If not authenticated, redirect to Login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If onboarding is not completed, and we require it, redirect to Onboarding
  if (!user.onboardingCompleted && !allowIncompleteOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. If onboarding is ALREADY completed, and they try to visit Onboarding page, redirect to Dashboard
  const searchParams = new URLSearchParams(location.search);
  const isEditing = searchParams.get('edit') === 'true';
  
  if (user.onboardingCompleted && allowIncompleteOnboarding && location.pathname === '/onboarding' && !isEditing) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
