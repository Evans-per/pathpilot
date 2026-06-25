import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, Lock, Key, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = Request, 2 = Reset Form
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visibleToken, setVisibleToken] = useState('');

  // Handle Request Token
  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email.');

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data && res.data.success) {
        setSuccess('Reset token generated successfully!');
        setVisibleToken(res.data.resetToken);
        setToken(res.data.resetToken); // Pre-fill token for easy test!
        setStep(2); // Go to Reset Password step
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request. Verify email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!token || !newPassword) return setError('Please fill in both fields.');
    if (newPassword.length < 6) return setError('New password must be at least 6 characters.');

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', { token, password: newPassword });
      if (res.data && res.data.success) {
        setSuccess('Password updated successfully! Please log in now.');
        setStep(3); // Success Screen
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-darkbg sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-darkbg-border animate-slide-in">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/20">
            <Key className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">Recover Password</h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {step === 1 ? 'Enter your email to obtain a reset token' : 'Set your new password below'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center space-x-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="flex items-center space-x-2 rounded-xl bg-green-50 p-3 text-xs text-green-700 border border-green-200/50 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30">
            <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* STEP 1: Request Token Form */}
        {step === 1 && (
          <form onSubmit={handleRequestToken} className="mt-8 space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent py-3 font-bold text-white shadow-lg shadow-accent/15 hover:bg-accent-dark transition-all disabled:opacity-50"
            >
              {loading ? 'Requesting...' : 'Request Reset Token'}
            </button>
          </form>
        )}

        {/* STEP 2: Reset Password Form */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            {/* Developer/Testing Tip Box */}
            {visibleToken && (
              <div className="rounded-xl bg-blue-50/50 p-3.5 border border-blue-200/50 dark:bg-blue-950/15 dark:border-blue-900/30">
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Local Testing Token</p>
                <code className="block mt-1 p-2 bg-white rounded border border-blue-100 font-mono text-[10px] text-slate-700 dark:bg-darkbg-card dark:border-darkbg-border dark:text-slate-300 break-all select-all">
                  {visibleToken}
                </code>
                <p className="mt-1.5 text-[9px] text-slate-400">No email server configured. We've printed and prefilled the token for you.</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="token">
                Reset Token
              </label>
              <input
                id="token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white font-mono"
                placeholder="Enter the copied token"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="newPassword">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent py-3 font-bold text-white shadow-lg shadow-accent/15 hover:bg-accent-dark transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}

        {/* STEP 3: Complete Success Screen */}
        {step === 3 && (
          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="w-full inline-flex justify-center items-center rounded-xl bg-accent py-3 font-bold text-white shadow-lg shadow-accent/15 hover:bg-accent-dark transition-all"
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
