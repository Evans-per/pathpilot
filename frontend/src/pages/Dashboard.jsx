import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, 
  Clock, 
  CheckSquare, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Award,
  Calendar as CalendarIcon,
  Play,
  ChevronRight,
  Target,
  Brain,
  ExternalLink,
  BookMarked
} from 'lucide-react';

// ChartJS imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Circular Progress Ring component
const CircularProgress = ({ percentage, size = 64, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-accent transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
        {percentage}%
      </span>
    </div>
  );
};

const Dashboard = () => {
  const { user, refreshProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOnboarded, setIsOnboarded] = useState(false);

  // Overhaul custom features states
  const [dailyPlan, setDailyPlan] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState({});
  const [activeEmbedId, setActiveEmbedId] = useState(null);
  const [activeEmbedTitle, setActiveEmbedTitle] = useState('');

  const navigate = useNavigate();

  const fetchAdditionalData = async () => {
    try {
      const planRes = await api.get('/ai/daily-plan');
      if (planRes.data && planRes.data.success) {
        setDailyPlan(planRes.data.today_plan);
      }
    } catch (err) {
      console.log('Daily plan fetch failed or not configured yet.');
    }

    try {
      const analyticsRes = await api.get('/ai/analytics');
      if (analyticsRes.data && analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics);
      }
    } catch (err) {
      console.log('Analytics fetch failed.');
    }
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data && res.data.success) {
        setStats(res.data.stats);
        setLogs(res.data.studyLogs || []);
        setCompletedTasks(res.data.completedTasks || []);
        setIsOnboarded(res.data.onboardingCompleted);

        // Fetch AI Daily Plan and Analytics if onboarded
        if (res.data.onboardingCompleted) {
          fetchAdditionalData();
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Could not fetch study metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    refreshProfile(); // Get latest XP/Points
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load recommended videos for interest topic
  useEffect(() => {
    if (isOnboarded && user?.onboardingData?.interest) {
      const fetchRecommended = async () => {
        setLoadingVideos(true);
        try {
          const res = await api.get('/videos', {
            params: { topic: user.onboardingData.interest }
          });
          if (res.data && res.data.success) {
            setRecommendedVideos(res.data.videos.slice(0, 3)); // Display top 3
          }
        } catch (err) {
          console.log('Error fetching recommended videos for dashboard:', err.message);
        } finally {
          setLoadingVideos(false);
        }
      };
      fetchRecommended();
    }
  }, [isOnboarded, user?.onboardingData?.interest]);

  const toggleTaskCheck = (idx) => {
    setCheckedTasks(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium animate-pulse">Loading workspace analytics...</p>
      </div>
    );
  }

  // Monthly Calendar Grid Generator
  const renderMonthlyCalendar = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayOffset = new Date(year, month, 1).getDay();
    const todayDay = currentDate.getDate();

    const dayCells = [];
    for (let i = 0; i < firstDayOffset; i++) {
      dayCells.push(<div key={`empty-${i}`} className="aspect-square bg-transparent"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const logMatch = logs.find(log => log.date === dateStr);
      const hoursLogged = logMatch ? logMatch.hours : 0;
      
      const hasStudied = hoursLogged > 0;
      const isFuture = day > todayDay;
      const isToday = day === todayDay;

      let cellStyle = 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'; // Default Future
      let icon = null;

      if (!isFuture) {
        if (hasStudied) {
          cellStyle = 'bg-success text-white font-bold shadow-md shadow-success/15 border border-green-400 scale-[1.02]';
          icon = <span className="text-[9px]">✓</span>;
        } else {
          cellStyle = 'bg-danger/15 text-danger font-bold border border-danger/25 dark:bg-danger/20';
          icon = <span className="text-[9px]">✗</span>;
        }
      }

      if (isToday && !hasStudied) {
        cellStyle = 'bg-slate-100 text-slate-800 border-2 border-warning font-bold dark:bg-slate-800 dark:text-slate-355 animate-pulse';
        icon = <span className="text-[9px] text-warning">•</span>;
      }

      dayCells.push(
        <div
          key={`day-${day}`}
          className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[10px] font-bold select-none relative group transition-all duration-300 hover:scale-105 ${cellStyle}`}
          title={hasStudied ? `Studied ${hoursLogged} hrs` : isFuture ? `Future day` : `Missed study day`}
        >
          <span>{day}</span>
          <div className="absolute bottom-0.5 leading-none">{icon}</div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-accent dark:text-blue-400" />
            <h3 className="font-bold text-slate-800 dark:text-white text-base">{monthNames[month]} {year}</h3>
          </div>
          <p className="text-[10px] text-slate-450 mt-1 uppercase font-semibold tracking-wider">Consistency Heatmap</p>
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-400 mb-2">
            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {dayCells}
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-[9px] font-semibold text-slate-500">
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded bg-success inline-block"></span>
            <span>Studied</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded bg-danger/20 inline-block border border-danger/30"></span>
            <span>Missed</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded bg-slate-200 inline-block dark:bg-slate-700"></span>
            <span>Future</span>
          </div>
        </div>
      </div>
    );
  };

  // Chart Setup
  const chartLabels = logs.length > 0 
    ? logs.slice(-7).map(log => log.date.substring(5)) 
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const chartValues = logs.length > 0
    ? logs.slice(-7).map(log => log.hours)
    : [0, 0, 0, 0, 0, 0, 0];

  const dailyGoalHours = stats?.weeklyGoal ? (stats.weeklyGoal / 7).toFixed(1) : 2;

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Study Hours',
        data: chartValues,
        backgroundColor: '#6366f1',
        borderRadius: 8,
        hoverBackgroundColor: '#4f46e5'
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.03)' } },
      x: { grid: { display: false } }
    }
  };

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Actual Hours',
        data: chartValues,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8b5cf6',
        borderWidth: 2.5
      },
      {
        label: 'Daily Target',
        data: Array(chartLabels.length).fill(parseFloat(dailyGoalHours)),
        borderColor: '#f59e0b',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        borderWidth: 1.5
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, font: { size: 9 }, color: '#94a3b8' }
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.03)' } },
      x: { grid: { display: false } }
    }
  };

  // ----------------------------------------------------
  // ONBOARDING INCOMPLETE PREVIEW DESIGN
  // ----------------------------------------------------
  if (!isOnboarded) {
    const previewBarData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Study Hours',
          data: [1.5, 3.0, 0.5, 2.5, 4.0, 2.0, 1.0],
          backgroundColor: 'rgba(99, 102, 241, 0.4)',
          borderRadius: 6
        }
      ]
    };

    const previewCalendarBoxes = [];
    for (let i = 1; i <= 30; i++) {
      const studied = [2, 3, 5, 7, 8, 12, 14, 15, 20, 21, 22].includes(i);
      const isPast = i <= 23;
      let style = 'bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-700';
      let check = null;

      if (isPast) {
        if (studied) {
          style = 'bg-success/20 text-success dark:bg-success/10 border border-success/35';
          check = '✓';
        } else {
          style = 'bg-danger/20 text-danger dark:bg-danger/10 border border-danger/35';
          check = '✗';
        }
      }

      previewCalendarBoxes.push(
        <div key={i} className={`aspect-square rounded flex flex-col items-center justify-center text-[8px] font-bold ${style}`}>
          <span>{i}</span>
          <span className="text-[8px] leading-none">{check}</span>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-slide-in">
        {/* Welcome message */}
        <div className="rounded-2xl bg-gradient-to-r from-accent to-secondary p-6 text-white shadow-xl shadow-accent/15 dark:from-slate-900 dark:to-slate-950 dark:border dark:border-darkbg-border dark:shadow-none">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Onboarding Pending</span>
              </div>
              <h1 className="text-2xl font-extrabold md:text-3xl">Welcome to PathPilot, {user?.name}!</h1>
              <p className="mt-1 text-xs text-indigo-100 max-w-xl dark:text-slate-400">
                You haven't generated a study timeline yet. Fill out the interest questionnaire to unlock personalized roadmaps, scored YouTube lectures, and habits tracking calendars!
              </p>
            </div>
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-xs font-bold text-accent shadow-md hover:bg-slate-100 transition-colors"
            >
              <span>Setup Onboarding</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Step-by-Step Setup Guide */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-center space-x-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-950/20 dark:text-green-400">✓</span>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">1. Account Active</h4>
              <p className="text-[9px] text-slate-450">Credentials set up.</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-center space-x-4 animate-pulse">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent dark:bg-accent/35 dark:text-blue-400 font-bold">2</span>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">2. Onboarding Survey</h4>
              <p className="text-[9px] text-slate-450">Complete preferences form.</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-center space-x-4 opacity-50">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 font-bold">3</span>
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">3. AI Roadmap</h4>
              <p className="text-[9px] text-slate-450">Build weekly curriculums.</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-center space-x-4 opacity-50">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 font-bold">4</span>
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-355">4. Begin Learning</h4>
              <p className="text-[9px] text-slate-450">Track habits and XP.</p>
            </div>
          </div>
        </div>

        {/* Dashboard Preview Overlay container */}
        <div className="relative rounded-2xl border border-slate-200/60 dark:border-darkbg-border overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-3 p-6 opacity-35 select-none pointer-events-none">
            <div className="lg:col-span-2 rounded-xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border">
              <h3 className="font-bold text-xs text-slate-650">Sample Study Analytics</h3>
              <div className="h-44 mt-4 relative"><Bar data={previewBarData} options={barChartOptions} /></div>
            </div>

            <div className="rounded-xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border">
              <h3 className="font-bold text-xs text-slate-650">Sample Streak Calendar</h3>
              <div className="grid grid-cols-7 gap-1 mt-4">{previewCalendarBoxes}</div>
            </div>
          </div>

          <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm dark:bg-darkbg/70 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-lg dark:bg-slate-900 border border-slate-200/50 dark:border-darkbg-border">
              <Sparkles className="h-6 w-6 text-accent dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Personalized Analytics Locked</h3>
              <p className="max-w-md text-xs text-slate-550 dark:text-slate-400 mt-1">
                Generate your learning roadmap to track streaks, study sessions, achievements, and view progress charts.
              </p>
            </div>
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-accent/15 hover:bg-accent-dark transition-all animate-bounce"
            >
              <span>Onboard Profile</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULL DASHBOARD DESIGN (ONBOARDING COMPLETED)
  // ----------------------------------------------------
  const xp = user?.points || 0;
  const level = Math.floor(xp / 100) + 1;
  const nextLevelXp = level * 100;
  const prevLevelXp = (level - 1) * 100;
  const levelProgress = Math.round(((xp - prevLevelXp) / 100) * 100);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-accent to-secondary p-6 text-white shadow-xl shadow-accent/15 dark:from-slate-955 dark:to-slate-900 dark:border dark:border-darkbg-border dark:shadow-none relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-48 w-48 rounded-full bg-white/5 blur-xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personalized Path Active</span>
            </div>
            <h1 className="text-2xl font-extrabold md:text-3xl">Welcome Back, {user?.name}!</h1>
            {analytics?.motivation_message ? (
              <p className="mt-1.5 text-xs text-indigo-100 max-w-xl dark:text-slate-400">
                {analytics.motivation_message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-indigo-100 max-w-xl dark:text-slate-400">
                You're currently in Week {stats?.currentWeek} of your personalized roadmap. Focus on completing your study slots today.
              </p>
            )}
          </div>
          <Link
            to="/planner"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-xs font-bold text-accent shadow-md hover:bg-slate-100 hover:scale-105 transition-all self-start md:self-auto"
          >
            <span>Study Planner</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Streak */}
        <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-center space-x-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400">
            <Flame className="h-6 w-6 fill-current animate-pulse" />
          </span>
          <div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{stats.streak}d</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Day Streak</p>
          </div>
        </div>

        {/* Level / XP */}
        <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-center space-x-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600 dark:bg-yellow-955/20 dark:text-yellow-400">
            <Award className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white">Lvl {level}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-450">{xp} / {nextLevelXp} XP</p>
          </div>
        </div>

        {/* Completion Percentage Ring */}
        <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{stats.completionPercentage}%</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-405">Completion</p>
          </div>
          <CircularProgress percentage={stats.completionPercentage} />
        </div>

        {/* Completed Tasks */}
        <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-center space-x-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-950/20 dark:text-green-400">
            <CheckSquare className="h-6 w-6" />
          </span>
          <div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{stats.completedTasksCount} / {stats.totalTasks}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Completed Tasks</p>
          </div>
        </div>

        {/* Hours Studied */}
        <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-center space-x-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400">
            <Clock className="h-6 w-6" />
          </span>
          <div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{stats.totalHoursStudied}h</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Hours</p>
          </div>
        </div>
      </div>

      {/* Main 12-Column Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Columns (8 Cols / 2 Units) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Study Tasks (Active Slots) */}
          <div className="rounded-2xl bg-white p-6 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center space-x-2">
                  <Target className="h-4.5 w-4.5 text-accent" />
                  <span>Today's Adaptive Slots</span>
                </h3>
                <p className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold mt-0.5 font-mono">Estimated: {dailyPlan?.estimated_time || '2 hours'}</p>
              </div>
              <Link to="/planner" className="text-[11px] font-bold text-accent hover:text-accent-dark flex items-center space-x-0.5">
                <span>Adjust slots</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {dailyPlan ? (
              <div className="mt-4 space-y-4">
                {/* Visual study block description */}
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
                    <span className="text-[9px] font-extrabold text-accent uppercase tracking-wider">Morning Study Slot</span>
                    <h4 className="font-bold text-slate-805 dark:text-white text-xs mt-1 truncate">{dailyPlan.slot1}</h4>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
                    <span className="text-[9px] font-extrabold text-secondary uppercase tracking-wider">Evening Practice Slot</span>
                    <h4 className="font-bold text-slate-805 dark:text-white text-xs mt-1 truncate">{dailyPlan.slot2}</h4>
                  </div>
                </div>

                {/* Subtask Checklists */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned sub-tasks</p>
                  <div className="space-y-2.5">
                    {dailyPlan.tasks && dailyPlan.tasks.map((task, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => toggleTaskCheck(idx)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                          checkedTasks[idx] 
                            ? 'bg-success/5 border-success/30 text-slate-450 dark:bg-success/5 dark:border-success/20 line-through' 
                            : 'bg-white border-slate-100 hover:border-slate-200 dark:bg-darkbg-card dark:border-slate-800 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="text-sm">{task.icon || '📖'}</span>
                          <span className="text-xs font-semibold truncate dark:text-slate-200">{task.task}</span>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{task.duration}</span>
                          <input 
                            type="checkbox" 
                            checked={!!checkedTasks[idx]}
                            onChange={() => {}} // handled by div click
                            className="rounded border-slate-300 text-accent focus:ring-accent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breaks Section */}
                {dailyPlan.breaks && dailyPlan.breaks.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Rest Intervals</p>
                    <div className="flex flex-wrap gap-2">
                      {dailyPlan.breaks.map((brk, idx) => (
                        <div key={idx} className="flex items-center space-x-1.5 rounded-lg bg-orange-50 dark:bg-orange-955/20 border border-orange-100/30 px-3 py-1.5 text-[10px] text-orange-700 dark:text-orange-400 font-semibold">
                          <span>☕</span>
                          <span>{brk.duration} ({brk.type}) after {brk.after}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                AI daily study suggestions will show up here after roadmap initialized.
              </div>
            )}
          </div>

          {/* Recommended Lectures Horizontal Slide */}
          <div className="rounded-2xl bg-white p-6 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-805 dark:text-white text-sm flex items-center space-x-2">
                  <Play className="h-4.5 w-4.5 text-accent" />
                  <span>Curated Courses For You</span>
                </h3>
                <p className="text-[10px] text-slate-400">Scored lecture recommendations based on onboarding interest: <span className="font-bold text-accent">{user?.onboardingData?.interest}</span></p>
              </div>
              <Link to="/videos" className="text-[11px] font-bold text-accent hover:text-accent-dark flex items-center space-x-0.5">
                <span>View all</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loadingVideos ? (
              <div className="h-28 flex items-center justify-center text-xs text-slate-405 animate-pulse">Loading videos...</div>
            ) : recommendedVideos.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-405">No matching videos found. Modify interests in profile.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {recommendedVideos.map((video) => (
                  <div 
                    key={video.videoId}
                    className="group relative rounded-xl border border-slate-105 dark:bg-darkbg dark:border-slate-800 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div 
                      className="relative aspect-video cursor-pointer overflow-hidden bg-slate-100"
                      onClick={() => {
                        setActiveEmbedId(video.videoId);
                        setActiveEmbedTitle(video.title);
                      }}
                    >
                      <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30">
                        <span className="h-8 w-8 rounded-full bg-white/90 text-accent flex items-center justify-center shadow-lg group-hover:bg-white scale-90 group-hover:scale-100 transition-all">
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        </span>
                      </div>
                    </div>
                    <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                      <h4 
                        onClick={() => {
                          setActiveEmbedId(video.videoId);
                          setActiveEmbedTitle(video.title);
                        }}
                        className="text-[11px] font-bold text-slate-805 dark:text-slate-200 line-clamp-2 leading-tight cursor-pointer hover:text-accent"
                      >
                        {video.title}
                      </h4>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold">
                        <span className="truncate max-w-[65px]">{video.channel}</span>
                        {video.score && (
                          <span className="text-[8px] font-extrabold text-accent bg-blue-50 dark:bg-blue-950/20 px-1 py-0.5 rounded">
                            {video.score}% fit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Charts Layout (Bar / Line stacked or Side-by-Side) */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-xs">Weekly consistency</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Study hours logged over previous 7 days.</p>
              </div>
              <div className="h-48 mt-4 relative">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-xs">Study Efficiency</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">Compare actual study logs with target daily requirements.</p>
              </div>
              <div className="h-48 mt-4 relative">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (4 Cols / 1 Unit) */}
        <div className="space-y-6 flex flex-col">
          {/* Monthly Streak Calendar */}
          <div>
            {renderMonthlyCalendar()}
          </div>

          {/* Upcoming Roadmap Milestones */}
          <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center space-x-2">
                <BookMarked className="h-4.5 w-4.5 text-accent" />
                <span>Roadmap Milestones</span>
              </h3>
              <p className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold">Timeline tracker</p>
            </div>

            <div className="space-y-3.5">
              {/* Active / Current Week */}
              <div className="relative pl-5 border-l-2 border-accent">
                <span className="absolute left-0 top-1 -translate-x-1.5 h-3.5 w-3.5 rounded-full bg-accent ring-4 ring-accent/15 flex items-center justify-center text-[8px] font-bold text-white">★</span>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-805 dark:text-slate-200">Week {stats.currentWeek} (Active)</h4>
                    <span className="text-[8px] font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded">Learning</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{analytics?.focus_area || 'Mastering current core concepts'}</p>
                </div>
              </div>

              {/* Next Week */}
              {stats.currentWeek < stats.totalWeeks && (
                <div className="relative pl-5 border-l-2 border-slate-200 dark:border-slate-800 opacity-60">
                  <span className="absolute left-0 top-1 -translate-x-1.5 h-3.5 w-3.5 rounded-full bg-slate-200 dark:bg-slate-800"></span>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">Week {stats.currentWeek + 1}</h4>
                      <span className="text-[8px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">Locked</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Next milestone objectives</p>
                  </div>
                </div>
              )}

              {/* End Goal */}
              <div className="relative pl-5 opacity-40">
                <span className="absolute left-0 top-1 -translate-x-1.5 h-3.5 w-3.5 rounded-full bg-slate-200 dark:bg-slate-800"></span>
                <div>
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-450">Week {stats.totalWeeks} (Final Capstone)</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">Target: {analytics?.predicted_finish_date || 'Roadmap completion'}</p>
                </div>
              </div>
            </div>

            <Link
              to="/roadmap"
              className="flex w-full justify-center items-center rounded-xl border border-slate-100 bg-slate-50 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-850 dark:bg-slate-900/40 dark:text-slate-350 dark:hover:bg-slate-800 transition-colors"
            >
              <span>View Full Timeline</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>

          {/* Weak Areas Card */}
          <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-805 dark:text-white text-sm flex items-center space-x-2">
                <Brain className="h-4.5 w-4.5 text-danger" />
                <span>Weak Topics Tracker</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Review concepts with lower quiz scores or less consistency.</p>
            </div>

            {completedTasks.length > 0 ? (
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/15 flex items-start space-x-3">
                  <span className="text-base text-red-500 mt-0.5">⚠️</span>
                  <div>
                    <h4 className="text-xs font-bold text-red-800 dark:text-red-400">Concept Review Recommended</h4>
                    <p className="text-[10px] text-red-650 dark:text-red-300 mt-0.5 leading-relaxed">
                      You have a few skipped or low-scoring quiz modules. Focus on flashcards this week to reinforce active recall.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link 
                    to="/quiz" 
                    className="flex-1 text-center py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 text-[10px] font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Take quiz
                  </Link>
                  <Link 
                    to="/flashcards" 
                    className="flex-1 text-center py-2.5 rounded-xl bg-accent text-[10px] font-bold text-white hover:bg-accent-dark transition-colors shadow-xs"
                  >
                    Study flashcards
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-405 text-center py-4">No quiz records found. Take your first weekly quiz to begin tracking weak spots.</p>
            )}
          </div>

        </div>
      </div>

      {/* Lightbox Embed Iframe Player */}
      {activeEmbedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 overflow-hidden shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
              <span className="text-xs font-bold max-w-[80%] truncate">{activeEmbedTitle}</span>
              <button
                onClick={() => {
                  setActiveEmbedId(null);
                  setActiveEmbedTitle('');
                }}
                className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20 transition-colors text-white font-bold text-xs"
              >
                Close
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              {activeEmbedId.startsWith('mockVideoId') ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-450">
                  <Play className="h-16 w-16 text-accent mb-4 animate-pulse" />
                  <h4 className="text-sm font-bold text-white">Lecture Simulation</h4>
                  <p className="max-w-md text-[10px] mt-1 text-slate-550">
                    This is a sandbox video course node. In production, this embeds the YouTube video player for ID: <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-accent">{activeEmbedId.split('_')[0]}</code>
                  </p>
                  <button
                    onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(activeEmbedTitle)}`, '_blank')}
                    className="mt-6 flex items-center space-x-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white hover:bg-accent-dark transition-all"
                  >
                    <span>Open search on YouTube</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <iframe
                  title="YouTube video player"
                  src={`https://www.youtube.com/embed/${activeEmbedId}?autoplay=1`}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;