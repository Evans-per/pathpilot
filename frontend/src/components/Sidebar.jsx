import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Map, 
  Tv, 
  Trophy, 
  User, 
  Settings,
  Flame,
  Brain,
  BookOpen,
  Sparkles,
  Award,
  Calendar,
  Layers,
  MoreHorizontal,
  X
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const sections = [
    {
      title: 'Learn',
      items: [
        { name: 'AI Roadmap', to: '/roadmap', icon: Map },
        { name: 'Find Videos', to: '/videos', icon: Tv },
        { name: 'Study Notes', to: '/notes', icon: BookOpen },
        { name: 'Flashcards', to: '/flashcards', icon: Sparkles },
        { name: 'Quiz', to: '/quiz', icon: Brain },
      ]
    },
    {
      title: 'Track',
      items: [
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { name: 'Study Planner', to: '/planner', icon: Calendar },
        { name: 'Leaderboard', to: '/leaderboard', icon: Trophy },
      ]
    },
    {
      title: 'Account',
      items: [
        { name: 'Profile', to: '/profile', icon: User },
        { name: 'Settings', to: '/settings', icon: Settings },
      ]
    }
  ];

  const mobileMainItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Roadmap', to: '/roadmap', icon: Map },
    { name: 'Videos', to: '/videos', icon: Tv },
    { name: 'Notes', to: '/notes', icon: BookOpen },
  ];

  const mobileMoreItems = [
    { name: 'Flashcards', to: '/flashcards', icon: Sparkles },
    { name: 'Quiz', to: '/quiz', icon: Brain },
    { name: 'Study Planner', to: '/planner', icon: Calendar },
    { name: 'Leaderboard', to: '/leaderboard', icon: Trophy },
    { name: 'Profile', to: '/profile', icon: User },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  // Compute level from XP
  const xp = user?.points || 0;
  const level = Math.floor(xp / 100) + 1;
  const nextLevelXp = level * 100;
  const prevLevelXp = (level - 1) * 100;
  const levelProgress = Math.min(100, Math.max(0, ((xp - prevLevelXp) / 100) * 100));

  return (
    <>
      {/* Mobile More Drawer Overlay */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="absolute bottom-16 left-0 w-full bg-white dark:bg-darkbg border-t border-slate-200 dark:border-darkbg-border rounded-t-2xl p-5 shadow-2xl space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">More Features</h3>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 py-1">
              {mobileMoreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={() => setShowMoreMenu(false)}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center rounded-xl p-3 text-[10px] font-bold transition-all border ${
                        isActive
                          ? 'bg-accent/10 border-accent/20 text-accent dark:bg-accent/20 dark:border-accent/40 dark:text-blue-450'
                          : 'border-slate-50 dark:border-slate-850 bg-slate-50/50 hover:bg-slate-50 dark:bg-darkbg-card dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 mb-1 text-slate-500 dark:text-slate-455" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <aside className="fixed bottom-0 left-0 z-30 w-full border-t border-slate-200 bg-white dark:border-darkbg-border dark:bg-darkbg md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:w-64 md:border-t-0 md:border-r md:p-5 flex flex-col justify-between overflow-y-auto">
        {/* Desktop Layout */}
        <div className="hidden md:block space-y-6">
          {/* User Level Card */}
          {user && (
            <div className="rounded-2xl bg-slate-50 dark:bg-darkbg-card p-4 border border-slate-100 dark:border-darkbg-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 dark:bg-accent/20 text-accent font-extrabold text-xs">
                    Lvl {level}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level Progress</p>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{xp} / {nextLevelXp} XP</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-orange-500">
                  <Flame className="h-4.5 w-4.5 fill-current animate-pulse" />
                  <span className="text-xs font-bold">{user.streak || 0}d</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${levelProgress}%` }} />
              </div>
            </div>
          )}

          {/* Navigation Sections */}
          <nav className="flex flex-col space-y-5">
            {sections.map((section) => (
              <div key={section.title} className="space-y-1.5 w-full">
                <h4 className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-4">
                  {section.title}
                </h4>
                <div className="flex flex-col space-y-1 w-full">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.to}
                        className={({ isActive }) =>
                          `flex items-center space-x-3.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${
                            isActive
                              ? 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-blue-400'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/40 dark:hover:text-slate-200'
                          }`
                        }
                      >
                        <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Mobile Layout Bottom Bar */}
        <nav className="flex md:hidden justify-around items-center w-full py-1">
          {mobileMainItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center rounded-xl py-1 px-3 text-[10px] font-bold transition-all duration-200 ${
                    isActive
                      ? 'text-accent dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span className="mt-0.5">{item.name}</span>
              </NavLink>
            );
          })}
          {/* More trigger */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center rounded-xl py-1 px-3 text-[10px] font-bold transition-all duration-200 ${
              showMoreMenu
                ? 'text-accent dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="mt-0.5">More</span>
          </button>
        </nav>

        {/* Tiny Footer */}
        <div className="hidden md:block border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center">
          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">PathPilot AI v1.2</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
