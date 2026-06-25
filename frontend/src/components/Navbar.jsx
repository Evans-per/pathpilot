import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bell, LogOut, Award, User, Settings as SettingsIcon, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate('/videos', { state: { query: searchVal } });
      setSearchVal('');
    }
  };

  // Mock notifications
  const notifications = [
    { id: 1, text: '📅 Time to study! Morning slot is active.', read: false },
    { id: 2, text: '🔥 3-Day streak achieved! Keep it up (+5 XP)', read: true },
    { id: 3, text: '🚀 Your AI roadmap has been updated successfully.', read: true }
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-darkbg-border dark:bg-darkbg/80">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/20">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </span>
              <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                Path<span className="text-accent">Pilot</span>
              </span>
            </Link>
          </div>

          {/* Global Search Bar */}
          {user && (
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  id="global-search"
                  type="text"
                  placeholder="Search lectures & topics (Enter to search)..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-12 text-xs font-semibold focus:border-accent focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-darkbg-card dark:text-white dark:focus:border-blue-500 transition-all"
                />
                <kbd className="absolute right-2.5 top-2 hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-white dark:bg-slate-800 dark:text-slate-550 border border-slate-200 dark:border-slate-700 rounded shadow-sm select-none">
                  {navigator.platform.indexOf('Mac') > -1 ? '⌘K' : 'Ctrl+K'}
                </kbd>
              </div>
            </div>
          )}

          {/* Actions Menu */}
          <div className="flex items-center space-x-4">
            {/* Gamification Points Badge */}
            {user && (
              <div className="flex items-center space-x-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                <Award className="h-4 w-4 animate-bounce" />
                <span>{user.points || 0} XP</span>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-darkbg"></span>
              </button>

              {/* Notification Box */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white p-2 shadow-xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 animate-slide-in">
                  <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Notifications</h3>
                  </div>
                  <div className="mt-1 space-y-1">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`rounded-lg px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                          !notif.read ? 'bg-slate-50/50 font-medium dark:bg-slate-800/20' : ''
                        }`}
                      >
                        {notif.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 rounded-full border border-slate-200 p-1 pr-3 hover:bg-slate-50 dark:border-darkbg-border dark:hover:bg-slate-800 transition-all"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent font-bold uppercase text-sm dark:bg-accent/20">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 md:block max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>

                {/* Dropdown Items */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 animate-slide-in">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    >
                      <User className="h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    >
                      <SettingsIcon className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <hr className="my-1 border-slate-100 dark:border-slate-800" />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
