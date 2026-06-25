import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  User as UserIcon, 
  Mail, 
  Award, 
  Flame, 
  Clock, 
  BookOpen, 
  CheckCircle,
  HelpCircle,
  Briefcase,
  Wrench,
  ShieldCheck
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        const res = await api.get('/dashboard');
        if (res.data && res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Error loading profile stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Badges Calculation Logic
  const badges = [
    {
      id: 'onboarding',
      name: 'Onboarding Pioneer',
      desc: 'Completed initial profile setup.',
      icon: CheckCircle,
      unlocked: true, // Always unlocked since user is in profile
      color: 'bg-green-500'
    },
    {
      id: 'xp_master',
      name: 'XP High Achiever',
      desc: 'Accumulated over 100 study points.',
      icon: Award,
      unlocked: user?.points >= 100,
      color: 'bg-blue-500'
    },
    {
      id: 'streak_warrior',
      name: 'Streak Champion',
      desc: 'Studied for 3 consecutive days.',
      icon: Flame,
      unlocked: user?.streak >= 3,
      color: 'bg-orange-500'
    },
    {
      id: 'final_capstone',
      name: 'Capstone Master',
      desc: 'Completed final capstone project.',
      icon: ShieldCheck,
      unlocked: stats?.completionPercentage === 100 && stats?.totalTasks > 0,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-slide-in">
      
      {/* Profile Header Card */}
      <div className="rounded-2xl bg-white p-6 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold uppercase text-3xl dark:bg-accent/20">
          {user?.name.charAt(0)}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white md:text-2xl">{user?.name}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start">
            <Mail className="mr-1.5 h-4 w-4 text-slate-400" />
            <span>{user?.email}</span>
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5 justify-center sm:justify-start">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400">
              {user?.points || 0} XP Total
            </span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold text-orange-700 border border-orange-200/50 dark:bg-orange-950/20 dark:text-orange-400">
              {user?.streak || 0}-Day Streak
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Onboarding Preference Info */}
        <div className="md:col-span-2 rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Study Profiles</h3>
          
          {user?.onboardingData ? (
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl bg-slate-50/50 p-3.5 border border-slate-100 dark:bg-darkbg dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Interest Subject</span>
                <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{user.onboardingData.interest}</p>
              </div>

              <div className="rounded-xl bg-slate-50/50 p-3.5 border border-slate-100 dark:bg-darkbg dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Experience Level</span>
                <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{user.onboardingData.level}</p>
              </div>

              <div className="rounded-xl bg-slate-50/50 p-3.5 border border-slate-100 dark:bg-darkbg dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Course Duration</span>
                <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{user.onboardingData.deadlineValue} {user.onboardingData.deadlineUnit}</p>
              </div>

              <div className="rounded-xl bg-slate-50/50 p-3.5 border border-slate-100 dark:bg-darkbg dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Study Styles</span>
                <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{user.onboardingData.learningStyle} Methods</p>
              </div>

              {user.onboardingData.existingSkills && user.onboardingData.existingSkills.length > 0 && (
                <div className="sm:col-span-2 rounded-xl bg-slate-50/50 p-3.5 border border-slate-100 dark:bg-darkbg dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pre-existing Skills</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {user.onboardingData.existingSkills.map((s, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 rounded px-2 py-0.5 font-semibold text-slate-600 dark:bg-darkbg-card dark:border-darkbg-border dark:text-slate-400">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-xs">No study profiles configured. Onboarding not completed.</p>
          )}
        </div>

        {/* Badges Achievements */}
        <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Achievements</h3>
            <p className="text-[10px] text-slate-400">Earn credentials badges by studying daily.</p>
          </div>

          <div className="space-y-3.5">
            {badges.map((badge) => {
              const IconComp = badge.icon;
              return (
                <div 
                  key={badge.id}
                  className={`flex items-center space-x-3.5 p-2 rounded-xl border transition-all ${
                    badge.unlocked 
                      ? 'border-slate-100 dark:border-slate-800' 
                      : 'opacity-40 border-dashed border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${
                    badge.unlocked ? badge.color : 'bg-slate-300 dark:bg-slate-800 text-slate-400'
                  }`}>
                    <IconComp className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{badge.name}</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
