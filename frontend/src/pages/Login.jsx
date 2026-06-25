import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect accordingly
  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = location.state?.from?.pathname || (user.onboardingCompleted ? '/dashboard' : '/onboarding');
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all credentials fields.');
    }

    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-darkbg sm:px-6 lg:px-8">
      <div className="absolute top-0 right-1/4 h-[300px] w-[300px] rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-600/5"></div>

      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-darkbg-border animate-slide-in">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/20">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </Link>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Sign in to resume your learning roadmaps
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center space-x-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="password">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[10px] font-semibold text-accent hover:text-accent-dark dark:text-blue-400"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center rounded-xl bg-accent py-3 font-bold text-white shadow-lg shadow-accent/15 hover:bg-accent-dark transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
            {!loading && <ArrowRight className="ml-2 h-4.5 w-4.5" />}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-accent hover:text-accent-dark dark:text-blue-400">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
