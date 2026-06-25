import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('pathpilot_token'));

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = res.data;
      
      localStorage.setItem('pathpilot_token', receivedToken);
      localStorage.setItem('pathpilot_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  // Sign up handler
  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('pathpilot_token', receivedToken);
      localStorage.setItem('pathpilot_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Try a different email.'
      };
    }
  };

  // Onboarding submit handler
  const submitOnboarding = async (formData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/onboarding', formData);
      const { user: updatedUser } = res.data;

      localStorage.setItem('pathpilot_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to submit onboarding answers.'
      };
    }
  };

  // Log out handler
  const logout = async () => {
    if (token) {
      try {
        await api.post('/auth/logout');
      } catch (err) {
        console.warn('Backend logout failed or session already dead:', err.message);
      }
    }
    localStorage.removeItem('pathpilot_token');
    localStorage.removeItem('pathpilot_user');
    setToken(null);
    setUser(null);
  };

  // Load user data on boot if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('pathpilot_user');
      
      if (token) {
        try {
          setUser(storedUser ? JSON.parse(storedUser) : null);
          // Verify with backend to get latest points/streak and ensure session is active
          const res = await api.get('/auth/profile');
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('pathpilot_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Auto login verification failed:', err.message);
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen to token expired events from api.js interceptor
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth_expired', handleAuthExpired);
    };
  }, [token]);

  // Refresh profile details (points/streak)
  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('pathpilot_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err.message);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    submitOnboarding,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
