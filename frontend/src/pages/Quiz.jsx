import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  CheckCircle, XCircle, Trophy, ArrowRight,
  RotateCcw, Brain, Zap, AlertCircle, Clock, Percent,
  Flame, HelpCircle
} from 'lucide-react';

const Quiz = () => {
  const [quiz, setQuiz] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]); // Array of strings (user selected answers)
  const [phase, setPhase] = useState('loading'); // loading | quiz | results | error
  const [weekInfo, setWeekInfo] = useState({ currentWeek: 1, weekGoal: '' });
  const [error, setError] = useState('');
  
  // Timer state
  const [timer, setTimer] = useState(0);
  const [streak, setStreak] = useState(0);

  const fetchQuiz = async () => {
    setPhase('loading');
    setError('');
    setCurrentQ(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers([]);
    setTimer(0);
    try {
      const res = await api.post('/ai/quiz');
      if (res.data?.quiz) {
        setQuiz(res.data.quiz);
        setWeekInfo({ currentWeek: res.data.currentWeek || 1, weekGoal: res.data.weekGoal || '' });
        
        // Load streak from profile
        try {
          const profileRes = await api.get('/auth/profile');
          if (profileRes.data?.success) {
            setStreak(profileRes.data.user?.streak || 0);
          }
        } catch (profileErr) {
          console.error('Failed to fetch profile streak for quiz:', profileErr);
        }
        
        setPhase('quiz');
      } else {
        throw new Error('Invalid quiz response structure.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate quiz. Please try again.');
      setPhase('error');
    }
  };

  useEffect(() => { fetchQuiz(); }, []);

  // Timer side effect
  useEffect(() => {
    if (phase !== 'quiz') return;
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleSelect = (option) => {
    if (!submitted) setSelected(option);
  };

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    setAnswers(prev => [...prev, selected]);
  };

  const handleNext = () => {
    if (currentQ + 1 >= quiz.length) {
      setPhase('results');
    } else {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setSubmitted(false);
    }
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const calculateQuizStats = () => {
    const totalAnsweredSoFar = answers.length;
    let correctCount = 0;
    answers.forEach((ans, idx) => {
      if (ans === quiz[idx]?.answer) correctCount++;
    });

    const accuracy = totalAnsweredSoFar > 0 ? Math.round((correctCount / totalAnsweredSoFar) * 100) : 100;
    return { correctCount, accuracy };
  };

  // ── LOADING ──
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative h-20 w-20 flex items-center justify-center rounded-full bg-accent/10">
          <Brain className="h-10 w-10 text-accent animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-slate-800 dark:text-white font-sans">Generating Week Quiz</h3>
          <p className="text-xs text-slate-400 mt-1 animate-pulse font-medium">Assembling 10 educational scenarios for active week testing…</p>
        </div>
      </div>
    );
  }

  // ── ERROR ──
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="h-12 w-12 text-danger" />
        <div className="text-center">
          <h3 className="font-bold text-slate-800 dark:text-white font-sans">Quiz Generation Failed</h3>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
        </div>
        <button onClick={fetchQuiz} className="flex items-center space-x-2 rounded-xl bg-accent text-white px-5 py-2.5 text-xs font-bold shadow-md hover:bg-indigo-600 transition-colors">
          <RotateCcw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  // ── RESULTS ──
  if (phase === 'results') {
    const { correctCount, accuracy } = calculateQuizStats();
    const scoreColor = accuracy >= 70 ? 'text-green-500' : accuracy >= 50 ? 'text-amber-500' : 'text-red-500';
    const scoreBg    = accuracy >= 70 ? 'bg-green-500'   : accuracy >= 50 ? 'bg-amber-500'   : 'bg-red-500';
    
    let recommendation;
    if (accuracy >= 85) recommendation = '🏆 Outstanding! You have completely mastered this week\'s roadmap concepts. Increase difficulty settings or dive deeper into milestones.';
    else if (accuracy >= 70) recommendation = '✅ Good progress! You understand the key foundations. Review questions you missed before checking off tasks.';
    else if (accuracy >= 50) recommendation = '📚 Getting there. Re-read your notes and check the planner checklist tasks to rebuild core context.';
    else recommendation = '🔄 Needs revision. Take your time to re-watch recommended video lectures and re-attempt this quiz.';

    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-slide-in">
        {/* Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-accent to-indigo-600 p-6 text-white shadow-xl">
          <div className="flex items-center space-x-3 mb-1.5">
            <Trophy className="h-7 w-7" />
            <h1 className="text-2xl font-extrabold font-sans">Quiz Completed!</h1>
          </div>
          <p className="text-indigo-100 text-xs">Week {weekInfo.currentWeek} · {weekInfo.weekGoal}</p>
        </div>

        {/* Analytics blocks */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Score card */}
          <div className="rounded-2xl bg-white dark:bg-darkbg-card border border-slate-100 dark:border-darkbg-border shadow-sm p-6 flex flex-col items-center justify-center">
            <p className={`text-5xl font-black ${scoreColor}`}>{accuracy}%</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Accuracy</p>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-2">{correctCount} of {quiz.length} correct</p>
            <div className="w-full mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className={`h-full rounded-full ${scoreBg}`} style={{ width: `${accuracy}%` }} />
            </div>
          </div>

          {/* Time & Streak */}
          <div className="sm:col-span-2 rounded-2xl bg-white dark:bg-darkbg-card border border-slate-100 dark:border-darkbg-border shadow-sm p-5 flex flex-col justify-center space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Spent</p>
                <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">{formatTime(timer)}</p>
              </div>
              <div className="flex items-center space-x-1.5 bg-orange-50 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400 rounded-xl px-3 py-1.5 border border-orange-100/50 dark:border-orange-900/20">
                <Flame className="h-4.5 w-4.5 fill-current animate-pulse" />
                <span className="text-xs font-bold">{streak}d Streak</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Learning Mentor Recommendation</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1 font-medium">{recommendation}</p>
            </div>
          </div>
        </div>

        <button onClick={fetchQuiz} className="flex items-center space-x-2 rounded-xl bg-accent text-white px-6 py-3 text-xs font-bold shadow-md shadow-indigo-500/10 hover:bg-indigo-600 transition-colors">
          <RotateCcw className="h-4 w-4" /><span>Retry Quiz</span>
        </button>
      </div>
    );
  }

  // ── QUIZ STATE ──
  const question = quiz[currentQ];
  const { correctCount, accuracy } = calculateQuizStats();
  const progress = Math.round((currentQ / quiz.length) * 100);

  const diffColors = {
    Easy:   'text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30',
    Medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30',
    Hard:   'text-red-600   bg-red-50   dark:bg-red-950/20   border-red-200   dark:border-red-900/30'
  };

  const isSelectedCorrect = submitted && selected === question?.answer;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-slide-in">
      
      {/* Page Header */}
      <div className="border-b border-slate-200/60 dark:border-darkbg-border pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl font-sans">Active Week Quiz</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Week {weekInfo.currentWeek} Goal: {weekInfo.weekGoal || 'Master current topics'}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* LEFT PANEL: QUESTION DETAILS (8 Columns) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="rounded-2xl bg-white dark:bg-darkbg-card border border-slate-100 dark:border-darkbg-border shadow-sm p-6 space-y-6">
            
            {/* Header info */}
            <div className="flex items-start justify-between gap-3">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${diffColors[question?.difficulty] || ''}`}>
                {question?.difficulty || 'Medium'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full px-3 py-0.5">
                {question?.type || 'Scenario'}
              </span>
            </div>

            {/* Question Text */}
            <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
              {question?.question}
            </p>

            {/* MCQ Options List */}
            <div className="space-y-2.5">
              {question?.options?.map((opt, idx) => {
                let cls = 'w-full text-left rounded-xl border px-4 py-3 text-xs font-semibold transition-all duration-200 ';
                if (!submitted) {
                  cls += selected === opt
                    ? 'border-accent bg-accent/5 text-accent dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-300'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300';
                } else {
                  if (opt === question.answer)   cls += 'border-green-400 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300';
                  else if (opt === selected)      cls += 'border-red-400   bg-red-50   text-red-700   dark:bg-red-950/20   dark:text-red-300';
                  else                           cls += 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-850 dark:bg-slate-900/10';
                }
                return (
                  <button key={idx} onClick={() => handleSelect(opt)} className={cls} disabled={submitted}>
                    <div className="flex items-center space-x-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-[10px] font-extrabold flex-shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 text-left">{opt}</span>
                      {submitted && opt === question.answer && <CheckCircle className="h-4.5 w-4.5 text-green-500 flex-shrink-0" />}
                      {submitted && opt === selected && opt !== question.answer && <XCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Instant Feedback Explanation Section */}
            {submitted && (
              <div className={`rounded-xl p-4 text-xs leading-relaxed border ${
                isSelectedCorrect 
                  ? 'bg-green-50/50 border-green-200 text-green-800 dark:bg-green-950/10 dark:border-green-900/30 dark:text-green-300' 
                  : 'bg-red-50/50 border-red-200 text-red-800 dark:bg-red-950/10 dark:border-red-900/30 dark:text-red-300'
              }`}>
                <p className="font-bold mb-1">{isSelectedCorrect ? '✅ Correct Answer!' : '❌ Incorrect Answer'}</p>
                <p>{question?.explanation}</p>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end pt-2">
              {!submitted ? (
                <button 
                  onClick={handleSubmit} 
                  disabled={!selected}
                  className="flex items-center space-x-2 rounded-xl bg-accent text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-indigo-500/10 hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Zap className="h-4 w-4" /><span>Submit Answer</span>
                </button>
              ) : (
                <button 
                  onClick={handleNext}
                  className="flex items-center space-x-2 rounded-xl bg-accent text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-indigo-500/10 hover:bg-indigo-600 transition-colors"
                >
                  <span>{currentQ + 1 >= quiz.length ? 'View Results' : 'Next Question'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: LIVE STATS & TIMER (4 Columns) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Performance Status Card */}
          <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Live Metrics</h3>
              <span className="flex items-center space-x-1 text-orange-500">
                <Flame className="h-4 w-4 fill-current animate-pulse" />
                <span className="text-xs font-bold">{streak}d Streak</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Timer */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Time</span>
                </div>
                <p className="text-xl font-black text-slate-800 dark:text-white">{formatTime(timer)}</p>
              </div>

              {/* Live Accuracy */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Percent className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Accuracy</span>
                </div>
                <p className="text-xl font-black text-slate-800 dark:text-white">{accuracy}%</p>
              </div>
            </div>

            {/* Score info */}
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3.5 border border-slate-100/50 dark:border-slate-850 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">CURRENT SCORE</span>
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">{correctCount} / {answers.length} Correct</span>
            </div>
          </div>

          {/* Guidelines info */}
          <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-start space-x-3">
            <Zap className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Mentorship Guideline</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                Aim for at least 70% accuracy (7/10 correct) to maintain your current week velocity. Scores higher than 85% will unlock harder adaptive topics.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM TRACKER & NAVIGATOR */}
      <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>COMPLETION PROGRESS</span>
            <span>{currentQ + (submitted ? 1 : 0)} / {quiz.length} Questions</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${Math.round(((currentQ + (submitted ? 1 : 0)) / quiz.length) * 100)}%` }} />
          </div>
        </div>

        {/* Question navigator dots */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Question Navigator</span>
          {quiz.map((q, idx) => {
            const hasAnswered = answers.length > idx;
            const isCorrect = hasAnswered && answers[idx] === q.answer;
            const isActive = currentQ === idx;

            let dotCls = 'flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all ';
            if (isActive) {
              dotCls += 'bg-accent text-white ring-2 ring-accent/20 ';
            } else if (hasAnswered) {
              dotCls += isCorrect 
                ? 'bg-green-500/10 text-green-600 border border-green-500/20 ' 
                : 'bg-red-500/10 text-red-600 border border-red-500/20 ';
            } else {
              dotCls += 'bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-400 hover:border-slate-300 ';
            }

            return (
              <button 
                key={idx} 
                disabled={true} // Read-only progress dots
                className={dotCls}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Quiz;
