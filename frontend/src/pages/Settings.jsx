import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Trash2, 
  AlertTriangle,
  RotateCcw,
  CheckCircle
} from 'lucide-react';

const Settings = () => {
  const { user, refreshProfile, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  
  const [confirmReset, setConfirmReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  
  const [customKey, setCustomKey] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keySuccess, setKeySuccess] = useState('');

  const navigate = useNavigate();

  const handleUpdateApiKey = async (e) => {
    e.preventDefault();
    setKeySaving(true);
    setKeySuccess('');
    setError('');

    try {
      const res = await api.post('/auth/api-key', { apiKey: customKey });
      if (res.data && res.data.success) {
        setKeySuccess('API key updated successfully!');
        setCustomKey('');
        await refreshProfile();
      }
    } catch (err) {
      console.error('Error saving API Key:', err);
      setError('Failed to save API Key.');
    } finally {
      setKeySaving(false);
    }
  };

  const handleResetProfile = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      // Direct call to delete profile onboarding & roadmap/progress
      // We will make a POST to /auth/onboarding with empty data, or we can add a specific reset endpoint!
      // Wait, let's think: we can just implement a dedicated endpoint in backend, or write a quick controller code.
      // Wait, let's implement a backend route `POST /auth/reset` or similar, or we can write a controller logic in `authController.js` and route it!
      // Yes, in `authRouter.js`, let's see. Did we define `/auth/reset`? We didn't, but we can easily define it or call `/auth/onboarding` and let the backend reset, OR we can add a `POST /auth/reset` to the backend auth routes.
      // Let's add it! In `authController.js`, let's check if we can add a `resetProfile` endpoint. Yes, it is extremely simple:
      // `exports.resetUser = async (req, res, next) => { ... }`
      // Let's write the fetch query here to `POST /auth/reset`. We will update `authController.js` and `authRouter.js` to add it.
      const res = await api.post('/auth/reset');
      if (res.data && res.data.success) {
        setSuccessMsg('Profile reset successfully! Redirecting to onboarding...');
        setTimeout(async () => {
          await refreshProfile(); // reload auth state
          navigate('/onboarding', { replace: true });
        }, 1500);
      }
    } catch (err) {
      console.error('Error resetting profile:', err);
      setError('Failed to reset profile records.');
      setConfirmReset(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-slide-in">
      
      {/* Header */}
      <div className="border-b border-slate-200/60 pb-4 dark:border-darkbg-border">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">Platform Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure layout themes and manage your student profile records.</p>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="flex items-center space-x-2 rounded-xl bg-green-50 p-4 text-xs text-green-700 border border-green-200/50 dark:bg-green-950/20 dark:text-green-400">
          <CheckCircle className="h-4.5 w-4.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 rounded-xl bg-red-50 p-4 text-xs text-red-700 border border-red-200/50 dark:bg-red-950/20 dark:text-red-400">
          <AlertTriangle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* THEME SETTING */}
      <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-white text-base">Appearance</h3>
        <div className="flex items-center justify-between py-2 border-t border-slate-50 dark:border-slate-800/60">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Dark Interface Mode</p>
            <p className="text-[10px] text-slate-400">Reduce glare and conserve power on compatible displays.</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-darkbg dark:text-slate-300 transition-colors"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
            <span>{darkMode ? 'Disable Dark Mode' : 'Enable Dark Mode'}</span>
          </button>
        </div>
      </div>

      {/* AI CONFIGURATION */}
      <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-base">AI Configuration</h3>
          <p className="text-[10px] text-slate-400">Configure your custom OpenAI API key to run direct, live ChatGPT queries.</p>
        </div>
        <form onSubmit={handleUpdateApiKey} className="py-4 border-t border-slate-50 dark:border-slate-800/60 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400" htmlFor="openai-key-input">
              OpenAI API Key (sk-...)
            </label>
            <div className="flex gap-2">
              <input
                id="openai-key-input"
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder={user?.customApiKey ? "••••••••••••••••••••••••••••••••" : "Paste your sk-... key here"}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
              />
              <button
                type="submit"
                disabled={keySaving}
                className="rounded-xl bg-accent text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-accent-dark transition-colors disabled:opacity-50"
              >
                {keySaving ? 'Saving...' : 'Save Key'}
              </button>
            </div>
            {keySuccess && <p className="text-[10px] text-green-600 font-semibold">{keySuccess}</p>}
          </div>
        </form>
      </div>

      {/* LEARNING PATH CONFIGURATION */}
      <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Learning Path</h3>
          <p className="text-[10px] text-slate-400">Change your subject interest, experience level, or study budget at any time.</p>
        </div>
        <div className="py-4 border-t border-slate-50 dark:border-slate-850/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Interest</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Currently studying: <span className="font-bold text-accent dark:text-blue-400">{user?.onboardingData?.interest || 'General'}</span></p>
          </div>
          <button
            onClick={() => navigate('/onboarding?edit=true')}
            className="flex items-center space-x-1.5 rounded-xl bg-accent text-white px-4 py-2.5 text-xs font-bold shadow-md hover:bg-accent-dark transition-colors"
          >
            <span>Change Path</span>
          </button>
        </div>
      </div>

      {/* RESET ACCOUNT / RESET TIMELINES */}
      <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4 border-l-4 border-l-red-500">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Danger Zone</h3>
          <p className="text-[10px] text-red-500 font-medium">Critical configuration changes that delete historical learning data.</p>
        </div>

        <div className="py-4 border-t border-slate-50 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Reset Roadmap & Profile</p>
            <p className="text-[10px] text-slate-400 max-w-sm">Deletes active learning roadmaps, logs, bookmarks, and returns profile status to the initial onboarding questionnaire.</p>
          </div>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center justify-center rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 transition-colors"
            >
              <Trash2 className="mr-1.5 h-4.5 w-4.5" />
              <span>Reset Profile</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2.5">
              <button
                onClick={handleResetProfile}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="mr-1.5 h-4.5 w-4.5 animate-spin" />
                <span>Confirm Reset</span>
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
