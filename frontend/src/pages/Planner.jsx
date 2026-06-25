import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  Play, 
  CheckCircle, 
  Compass, 
  BookOpen, 
  CheckSquare, 
  Info,
  Award
} from 'lucide-react';

const Planner = () => {
  const slotsList = [
    'Morning (8 AM - 10 AM)',
    'Noon (12 PM - 2 PM)',
    'Afternoon (3 PM - 5 PM)',
    'Evening (6 PM - 8 PM)',
    'Night (9 PM - 11 PM)'
  ];

  const initialSlot1 = localStorage.getItem('pathpilot_slot1') || 'Morning (8 AM - 10 AM)';
  const initialSlot2 = localStorage.getItem('pathpilot_slot2') || 'Evening (6 PM - 8 PM)';

  const [isSlot1Custom, setIsSlot1Custom] = useState(!slotsList.includes(initialSlot1));
  const [isSlot2Custom, setIsSlot2Custom] = useState(!slotsList.includes(initialSlot2));

  const [slot1, setSlot1] = useState(initialSlot1);
  const [slot2, setSlot2] = useState(initialSlot2);
  const [plan, setPlan] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [error, setError] = useState('');

  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Fetch initial completions from dashboard
  const fetchProgress = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data && res.data.success) {
        setCompletedTasks(res.data.completedTasks || []);
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleGeneratePlan = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    // Save choices to localStorage
    localStorage.setItem('pathpilot_slot1', slot1);
    localStorage.setItem('pathpilot_slot2', slot2);

    try {
      const res = await api.post('/planner', { slot1, slot2 });
      if (res.data && res.data.success) {
        setPlan(res.data.plan);
        setPlanGenerated(true);
      }
    } catch (err) {
      console.error('Error generating daily study plan:', err);
      setError(err.response?.data?.message || 'Could not compile daily planner.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger load initially if selections exist
  useEffect(() => {
    if (slot1 && slot2) {
      handleGeneratePlan();
    }
  }, []);

  const handleToggleTask = async (week, taskType, taskName) => {
    try {
      const res = await api.post('/complete-task', {
        week,
        taskType,
        taskName,
        studyHours: taskType === 'topic' ? 1.0 : 1.5 // log hours to progress studyLogs YYYY-MM-DD
      });

      if (res.data && res.data.success) {
        setCompletedTasks(res.data.completedTasks || []);
        
        // If checked, trigger XP pop-up
        if (res.data.completed) {
          setPointsEarned(res.data.pointsReward);
          setShowPointsModal(true);
          setTimeout(() => setShowPointsModal(false), 2000);
        }
        
        refreshProfile(); // Update navbar XP
      }
    } catch (err) {
      console.error('Error toggling task completion:', err);
    }
  };

  const isCompleted = (week, taskType, taskName) => {
    return completedTasks.some(
      t => t.week === week && t.taskType === taskType && t.taskName.toLowerCase() === taskName.toLowerCase()
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-slide-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-4 dark:border-darkbg-border">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">Study Planner</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Designate your study slots and receive today's objectives.</p>
        </div>
      </div>

      {/* SLOT SELECTION PANEL */}
      <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm">
        <form onSubmit={handleGeneratePlan} className="grid gap-4 sm:grid-cols-3 sm:items-end">
          {/* Slot 1 Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Slot 1 (Session A)</label>
              <button
                type="button"
                onClick={() => {
                  setIsSlot1Custom(!isSlot1Custom);
                  if (!isSlot1Custom) setSlot1('');
                  else setSlot1('Morning (8 AM - 10 AM)');
                }}
                className="text-[10px] font-bold text-accent dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              >
                {isSlot1Custom ? '📋 Presets' : '✏️ Custom'}
              </button>
            </div>
            {isSlot1Custom ? (
              <input
                type="text"
                value={slot1}
                onChange={(e) => setSlot1(e.target.value)}
                placeholder="e.g. Early Morning (6 AM - 8 AM)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
                required
              />
            ) : (
              <select
                value={slot1}
                onChange={(e) => setSlot1(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
              >
                {slotsList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          {/* Slot 2 Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Slot 2 (Session B)</label>
              <button
                type="button"
                onClick={() => {
                  setIsSlot2Custom(!isSlot2Custom);
                  if (!isSlot2Custom) setSlot2('');
                  else setSlot2('Evening (6 PM - 8 PM)');
                }}
                className="text-[10px] font-bold text-accent dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              >
                {isSlot2Custom ? '📋 Presets' : '✏️ Custom'}
              </button>
            </div>
            {isSlot2Custom ? (
              <input
                type="text"
                value={slot2}
                onChange={(e) => setSlot2(e.target.value)}
                placeholder="e.g. Late Night (10 PM - 12 AM)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
                required
              />
            ) : (
              <select
                value={slot2}
                onChange={(e) => setSlot2(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
              >
                {slotsList.filter(s => s !== slot1).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent py-2.5 text-xs font-bold text-white shadow-md shadow-accent/15 hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Compiling Plan...' : 'Load Today\'s Plan'}
          </button>
        </form>
      </div>

      {/* PLAN GENERATED DETAIL */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-4 text-center text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      ) : planGenerated && plan ? (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* SLOT 1 CARD */}
          <SlotPanel
            slotName="Session A"
            timeLabel={slot1}
            slotData={plan.slots.slot1}
            week={plan.week}
            onToggleTask={handleToggleTask}
            isCompleted={isCompleted}
            onWatchLectures={(topic) => navigate('/videos', { state: { query: topic } })}
          />

          {/* SLOT 2 CARD */}
          <SlotPanel
            slotName="Session B"
            timeLabel={slot2}
            slotData={plan.slots.slot2}
            week={plan.week}
            onToggleTask={handleToggleTask}
            isCompleted={isCompleted}
            onWatchLectures={(topic) => navigate('/videos', { state: { query: topic } })}
          />

        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 text-sm">
          Select your study slots and click Load to schedule today's learning objectives.
        </div>
      )}

      {/* XP EARNED NOTIFICATION MODAL */}
      {showPointsModal && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 rounded-full bg-green-500 px-6 py-3 font-bold text-white shadow-2xl flex items-center space-x-2 animate-bounce border border-green-400/20">
          <Award className="h-5 w-5 animate-pulse" />
          <span>Task Checked! +{pointsEarned} XP Awarded</span>
        </div>
      )}
    </div>
  );
};

// Reusable Slot detail panel
const SlotPanel = ({ slotName, timeLabel, slotData, week, onToggleTask, isCompleted, onWatchLectures }) => {
  if (!slotData) return null;

  const topicDone = slotData.topic ? isCompleted(week, slotData.isProject ? 'mini_project' : 'topic', slotData.topic) : false;
  const practiceDone = slotData.practiceTask ? isCompleted(week, 'practice', slotData.practiceTask) : false;

  return (
    <div className={`rounded-2xl border bg-white p-5 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex flex-col justify-between space-y-5 ${
      slotData.empty ? 'opacity-70' : ''
    }`}>
      {/* Slot header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-extrabold text-accent uppercase tracking-wider">{slotName}</span>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{timeLabel}</h3>
        </div>
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] text-slate-500 font-semibold dark:bg-slate-800 dark:text-slate-400 flex items-center">
          <Clock className="mr-1 h-3.5 w-3.5" />
          <span>Active Session</span>
        </span>
      </div>

      {/* Main content slot */}
      <div className="space-y-4 flex-1">
        {/* Lecture Target */}
        {slotData.topic && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Lesson Goal</h4>
            <div className="flex items-start justify-between rounded-xl bg-slate-50/50 p-3 border border-slate-100 dark:bg-darkbg dark:border-slate-800 gap-3">
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  checked={topicDone}
                  onChange={() => onToggleTask(week, slotData.isProject ? 'mini_project' : 'topic', slotData.topic)}
                  className="h-4.5 w-4.5 rounded accent-accent"
                />
                <span className={`text-xs font-semibold ${topicDone ? 'text-slate-400 line-through dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}`}>
                  {slotData.topic}
                </span>
              </div>
              {!slotData.isProject && !slotData.empty && (
                <button
                  onClick={() => onWatchLectures(slotData.topic)}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-accent/10 hover:bg-accent hover:text-white transition-all text-accent dark:bg-accent/20 dark:text-blue-400 dark:hover:bg-accent"
                >
                  <Play className="h-4 w-4 fill-current" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Practice Exercises */}
        {slotData.practiceTask && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hands-on practice task</h4>
            <div className="flex items-start space-x-2.5 rounded-xl bg-slate-50/20 p-3 border border-slate-100 dark:bg-darkbg/40 dark:border-slate-800/60">
              <input
                type="checkbox"
                checked={practiceDone}
                onChange={() => onToggleTask(week, 'practice', slotData.practiceTask)}
                className="mt-0.5 h-4.5 w-4.5 rounded accent-accent"
              />
              <span className={`text-xs ${practiceDone ? 'text-slate-400 line-through dark:text-slate-600' : 'text-slate-600 dark:text-slate-300 font-medium leading-relaxed'}`}>
                {slotData.practiceTask}
              </span>
            </div>
          </div>
        )}

        {/* Recommended Videos list (if any returned) */}
        {slotData.videos && slotData.videos.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Top Lecture Reference</h4>
            <div className="grid gap-2">
              {slotData.videos.map((vid) => (
                <div 
                  key={vid.videoId}
                  onClick={() => onWatchLectures(slotData.topic)}
                  className="flex items-center space-x-2.5 rounded-xl border border-slate-100 p-2 cursor-pointer hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    className="h-10 w-16 object-cover rounded-lg bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-[10px] truncate leading-tight">{vid.title}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{vid.channel} • {vid.score}% score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Planner;
