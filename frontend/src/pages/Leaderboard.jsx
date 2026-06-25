import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, Flame, Award, ShieldAlert } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/dashboard/leaderboard');
        if (res.data && res.data.success) {
          setLeaderboard(res.data.leaderboard || []);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Could not load community rankings.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-slide-in">
      
      {/* Header */}
      <div className="border-b border-slate-200/60 pb-4 dark:border-darkbg-border">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl font-sans">Global Leaderboard</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Study consistently, check off roadmap tasks, and climb the ranks.</p>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 p-4 text-center text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="rounded-2xl bg-white overflow-hidden border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm">
          {/* Table Header */}
          <div className="bg-slate-50/70 px-6 py-3.5 border-b border-slate-100 dark:bg-slate-950 dark:border-darkbg-border grid grid-cols-12 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">Rank</div>
            <div className="col-span-5">Student</div>
            <div className="col-span-3">Focus Interest</div>
            <div className="col-span-2 text-right">XP Points</div>
          </div>

          {/* List Content */}
          <div className="divide-y divide-slate-100 dark:divide-darkbg-border">
            {leaderboard.map((student) => {
              // Podiums styling helper
              const isFirst = student.rank === 1;
              const isSecond = student.rank === 2;
              const isThird = student.rank === 3;

              return (
                <div 
                  key={student.rank}
                  className={`px-6 py-4 grid grid-cols-12 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors ${
                    isFirst ? 'bg-amber-500/[0.02] dark:bg-amber-500/[0.01]' : ''
                  }`}
                >
                  {/* Rank Column */}
                  <div className="col-span-2 flex items-center">
                    {isFirst ? (
                      <Trophy className="h-5 w-5 text-amber-500 fill-amber-100 dark:fill-transparent" />
                    ) : isSecond ? (
                      <Trophy className="h-5 w-5 text-slate-400 fill-slate-100 dark:fill-transparent" />
                    ) : isThird ? (
                      <Trophy className="h-5 w-5 text-amber-700 fill-amber-100 dark:fill-transparent" />
                    ) : (
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-600 pl-1.5">{student.rank}</span>
                    )}
                  </div>

                  {/* Student Name */}
                  <div className="col-span-5 flex items-center space-x-3 min-w-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                      isFirst 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{student.name}</p>
                      {student.streak > 0 && (
                        <div className="flex items-center space-x-1 mt-0.5 text-orange-500 dark:text-orange-400">
                          <Flame className="h-3 w-3 fill-current" />
                          <span className="text-[9px] font-bold">{student.streak}d streak</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interest Subject */}
                  <div className="col-span-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {student.interest}
                    </span>
                  </div>

                  {/* XP Points */}
                  <div className="col-span-2 text-right font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center justify-end space-x-1.5">
                    <Award className={`h-4.5 w-4.5 ${isFirst ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
                    <span>{student.points} XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
