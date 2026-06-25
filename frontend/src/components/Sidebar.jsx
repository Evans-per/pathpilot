import React from 'react';
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
  Layers
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

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

  // Compute level from XP
  const xp = user?.points || 0;
  const level = Math.floor(xp / 100) + 1;
  const nextLevelXp = level * 100;
  const prevLevelXp = (level - 1) * 100;
  const levelProgress = Math.min(100, Math.max(0, ((xp - prevLevelXp) / 100) * 100));

  return (
    <aside className="fixed bottom-0 left-0 z-30 w-full border-t border-slate-200 bg-white dark:border-darkbg-border dark:bg-darkbg md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:w-64 md:border-t-0 md:border-r md:p-5 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        {/* User Level Card */}
        {user && (
          <div className="hidden md:block rounded-2xl bg-slate-50 dark:bg-darkbg-card p-4 border border-slate-100 dark:border-darkbg-border shadow-sm">
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
        <nav className="flex justify-around py-1 md:flex-col md:justify-start md:space-y-5 md:py-0">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1 md:space-y-1.5 w-full">
              <h4 className="hidden md:block text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-4">
                {section.title}
              </h4>
              <div className="flex justify-around md:flex-col md:space-y-1 w-full">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex flex-col items-center justify-center rounded-xl py-2 px-3 text-[9px] font-bold transition-all duration-200 md:flex-row md:justify-start md:space-x-3.5 md:py-2.5 md:px-4 md:text-xs ${
                          isActive
                            ? 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-blue-400'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/40 dark:hover:text-slate-200'
                        }`
                      }
                    >
                      <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                      <span className="mt-1 md:mt-0">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Tiny Footer */}
      <div className="hidden md:block border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center">
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">PathPilot AI v1.2</p>
      </div>
    </aside>
  );
};

export default Sidebar;
