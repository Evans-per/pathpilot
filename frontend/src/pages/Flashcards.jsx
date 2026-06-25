import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Sparkles, AlertCircle, ArrowLeft, ArrowRight,
  RotateCw, Check, CheckCircle2, Bookmark, HelpCircle,
  Flame, Award, BookOpen, Clock, Lightbulb, Keyboard
} from 'lucide-react';

const Flashcards = () => {
  const [cards, setCards] = useState([]);
  const [phase, setPhase] = useState('loading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Track review classifications: Easy, Medium, Hard
  const [cardDifficulties, setCardDifficulties] = useState({}); // { cardIndex: 'Easy' | 'Medium' | 'Hard' }
  const [completedCount, setCompletedCount] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  
  const [weekInfo, setWeekInfo] = useState({ currentWeek: 1, weekGoal: '' });
  const [upcomingTopics, setUpcomingTopics] = useState([]);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState('');

  const fetchFlashcardsAndRoadmap = async () => {
    setPhase('loading');
    setError('');
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardDifficulties({});
    setCompletedCount(0);
    setShowSuccessScreen(false);
    try {
      // 1. Fetch Flashcards
      const cardRes = await api.post('/ai/flashcards');
      if (!cardRes.data?.flashcards) {
        throw new Error('Invalid flashcards response structure.');
      }
      setCards(cardRes.data.flashcards);
      setWeekInfo({ 
         currentWeek: cardRes.data.currentWeek || 1, 
         weekGoal: cardRes.data.weekGoal || '' 
      });

      // 2. Fetch Dashboard for Streak & Completed Tasks
      try {
        const dbRes = await api.get('/dashboard');
        if (dbRes.data?.success) {
          setStreak(dbRes.data.stats?.streak || 0);
          setCompletedTasks(dbRes.data.completedTasks || []);
        }
      } catch (dbErr) {
        console.error('Failed to fetch dashboard data:', dbErr);
      }

      // 3. Fetch Roadmap for Upcoming Topics
      try {
        const roadmapRes = await api.get('/roadmap');
        if (roadmapRes.data?.success && roadmapRes.data.roadmap) {
          const activeWeek = cardRes.data.currentWeek || 1;
          const activeWeekData = roadmapRes.data.roadmap.roadmap.find(w => w.week === activeWeek);
          if (activeWeekData) {
            setUpcomingTopics(activeWeekData.topics || []);
          }
        }
      } catch (roadmapErr) {
        console.error('Failed to fetch upcoming topics from roadmap:', roadmapErr);
      }

      setPhase('cards');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate flashcards. Please try again.');
      setPhase('error');
    }
  };

  const isTopicCompleted = (topicName) => {
    return completedTasks.some(
      t => t.week === weekInfo.currentWeek && t.taskType === 'topic' && t.taskName.toLowerCase() === topicName.toLowerCase()
    );
  };

  const handleToggleTopic = async (topicName) => {
    try {
      const res = await api.post('/complete-task', {
        week: weekInfo.currentWeek,
        taskType: 'topic',
        taskName: topicName
      });
      if (res.data?.success) {
        setCompletedTasks(res.data.completedTasks || []);
      }
    } catch (err) {
      console.error('Failed to toggle topic completion:', err);
    }
  };

  const handleMarkAllTopicsCompleted = async () => {
    setMarkingAll(true);
    try {
      const pending = upcomingTopics.filter(t => !isTopicCompleted(t));
      if (pending.length > 0) {
        await Promise.all(
          pending.map(topic => 
            api.post('/complete-task', {
              week: weekInfo.currentWeek,
              taskType: 'topic',
              taskName: topic
            })
          )
        );
        // Refresh completed tasks list
        const dbRes = await api.get('/dashboard');
        if (dbRes.data?.success) {
          setCompletedTasks(dbRes.data.completedTasks || []);
        }
      }
    } catch (err) {
      console.error('Failed to mark all topics completed:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleRestartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardDifficulties({});
    setCompletedCount(0);
    setShowSuccessScreen(false);
  };

  const handleNext = () => {
    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
      }, 150);
    }
  };

  const handleSetDifficulty = (difficulty) => {
    const isNew = cardDifficulties[currentIndex] === undefined;
    setCardDifficulties(prev => ({
      ...prev,
      [currentIndex]: difficulty
    }));
    
    let newCompletedCount = completedCount;
    if (isNew) {
      newCompletedCount = completedCount + 1;
      setCompletedCount(newCompletedCount);
    }
    
    // Auto-advance to next card or show success screen if all cards are reviewed
    setTimeout(() => {
      if (currentIndex + 1 < cards.length) {
        handleNext();
      } else if (newCompletedCount === cards.length) {
        setShowSuccessScreen(true);
      }
    }, 400);
  };

  // 1. Mount Effect: Fetch flashcards on load
  useEffect(() => {
    fetchFlashcardsAndRoadmap();
  }, []);

  // 2. Keyboard Shortcuts Event Listener
  useEffect(() => {
    if (phase !== 'cards' || cards.length === 0) return;
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.key === '1') {
        handleSetDifficulty('Easy');
      } else if (e.key === '2') {
        handleSetDifficulty('Medium');
      } else if (e.key === '3') {
        handleSetDifficulty('Hard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, cards, currentIndex]);

  // ── LOADING ──
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative h-20 w-20 flex items-center justify-center rounded-full bg-accent/10">
          <Bookmark className="h-10 w-10 text-accent animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-slate-800 dark:text-white">Generating Flashcards</h3>
          <p className="text-xs text-slate-400 mt-1 animate-pulse">Designing active-recall decks tailored to your week's goals…</p>
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
          <h3 className="font-bold text-slate-800 dark:text-white font-sans">Failed to Load Flashcards</h3>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
        </div>
        <button onClick={fetchFlashcardsAndRoadmap} className="flex items-center space-x-2 rounded-xl bg-accent text-white px-5 py-2.5 text-xs font-bold shadow-md hover:bg-indigo-600 transition-colors">
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  // ── NO CARDS FOUND ──
  if (phase === 'cards' && cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Bookmark className="h-12 w-12 text-slate-400 dark:text-slate-600" />
        <div className="text-center">
          <h3 className="font-bold text-slate-800 dark:text-white font-sans">No Flashcards Found</h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">We couldn't retrieve any topics or concepts for this week to generate flashcards.</p>
        </div>
        <button onClick={fetchFlashcardsAndRoadmap} className="flex items-center space-x-2 rounded-xl bg-accent text-white px-5 py-2.5 text-xs font-bold shadow-md hover:bg-indigo-600 transition-colors">
          <span>Retry Generation</span>
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const masteryPercentage = totalCards > 0 ? Math.round((completedCount / totalCards) * 100) : 0;
  
  const difficultyCounts = Object.values(cardDifficulties).reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, { Easy: 0, Medium: 0, Hard: 0 });

  const activeDifficulty = cardDifficulties[currentIndex];

  const diffColors = {
    Easy:   'text-green-500 border-green-500/20 bg-green-500/5',
    Medium: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
    Hard:   'text-red-500   border-red-500/20   bg-red-500/5'
  };

  const studyTips = [
    "Active Recall: Force yourself to retrieve the answer before flipping the card. Re-reading is passive; retrieval builds pathways.",
    "Feynman Technique: Explain this concept out loud in 1 sentence. If you struggle, mark the card as Hard and review it again.",
    "Spaced Repetition: Review 'Hard' cards every day, 'Medium' cards every 3 days, and 'Easy' cards once a week to maximize memory retention."
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-slide-in">
      
      {/* Page Header */}
      <div className="border-b border-slate-200/60 dark:border-darkbg-border pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl font-sans">Active Recall Cards</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Week {weekInfo.currentWeek} Goal: {weekInfo.weekGoal || 'Master current topics'}</p>
        </div>
      </div>

      {/* 12-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* LEFT / CENTER PANEL (8 Columns) */}
        <div className="lg:col-span-8 space-y-5">
          {showSuccessScreen ? (
            <div className="w-full rounded-2xl bg-white dark:bg-darkbg-card border border-slate-100 dark:border-darkbg-border shadow-md p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[360px] animate-slide-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500 shadow-md">
                <Award className="h-9 w-9 text-emerald-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Deck Reviewed! 🎉</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
                  Excellent job! You have gone through all <strong>{totalCards}</strong> active-recall cards in this study deck.
                </p>
              </div>
              
              {/* Quick summary metrics */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs py-1.5">
                <div className="bg-green-50/50 dark:bg-green-950/10 border border-green-100/20 rounded-xl p-2.5">
                  <p className="text-lg font-bold text-green-500">{difficultyCounts.Easy}</p>
                  <p className="text-[10px] font-bold text-slate-400">Easy</p>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/20 rounded-xl p-2.5">
                  <p className="text-lg font-bold text-amber-500">{difficultyCounts.Medium}</p>
                  <p className="text-[10px] font-bold text-slate-400">Med</p>
                </div>
                <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100/20 rounded-xl p-2.5">
                  <p className="text-lg font-bold text-red-500">{difficultyCounts.Hard}</p>
                  <p className="text-[10px] font-bold text-slate-400">Hard</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
                <button
                  onClick={handleMarkAllTopicsCompleted}
                  disabled={markingAll || upcomingTopics.every(t => isTopicCompleted(t))}
                  className="flex-1 rounded-xl bg-accent hover:bg-indigo-600 hover:scale-[1.01] active:scale-[0.99] disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white py-3 text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>
                    {markingAll 
                      ? 'Updating progress...' 
                      : upcomingTopics.every(t => isTopicCompleted(t)) 
                        ? 'All Topics Completed ✅' 
                        : 'Mark Topics as Completed'}
                  </span>
                </button>
                <button
                  onClick={handleRestartSession}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
                >
                  <RotateCw className="h-4 w-4" />
                  <span>Practice Again</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Card Wrapper with 3D Flip */}
              <div 
                className="w-full h-80 cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ perspective: '1000px' }}
              >
                <div 
                  className="relative w-full h-full duration-500"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* FRONT SIDE */}
                  <div 
                    className="absolute inset-0 rounded-2xl bg-white dark:bg-darkbg-card border border-slate-100 dark:border-darkbg-border shadow-md p-8 flex flex-col justify-between"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(0deg)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full px-3 py-0.5">
                        {currentCard?.category || 'General'}
                      </span>
                      <div className="flex items-center space-x-2">
                        {activeDifficulty && (
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${diffColors[activeDifficulty] || ''}`}>
                            Marked: {activeDifficulty}
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-800 text-slate-400">
                          {currentCard?.difficulty || 'Medium'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center flex-1 text-center py-4">
                      <HelpCircle className="h-8 w-8 text-indigo-100 dark:text-slate-800 mb-3" />
                      <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white leading-relaxed max-w-lg">
                        {currentCard?.front}
                      </h2>
                    </div>

                    <div className="flex items-center justify-center space-x-1.5 text-[10px] font-bold text-slate-400">
                      <RotateCw className="h-3.5 w-3.5" />
                      <span>Click to Flip Card (or Spacebar)</span>
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div 
                    className="absolute inset-0 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-indigo-100 dark:border-slate-800/80 shadow-md p-8 flex flex-col justify-between"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-50/50 dark:bg-indigo-950/20 rounded-full px-3 py-0.5">
                        Answer Key
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400">
                        {currentCard?.difficulty || 'Medium'}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 text-center py-4">
                      <CheckCircle2 className="h-8 w-8 text-success mb-3" />
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed max-w-lg">
                        {currentCard?.back}
                      </p>
                    </div>

                    <div className="flex items-center justify-center space-x-1.5 text-[10px] font-bold text-indigo-400">
                      <RotateCw className="h-3.5 w-3.5" />
                      <span>Click to Flip Back</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation and Confidence Level Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                {/* Arrows */}
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <span className="text-xs font-bold text-slate-400 select-none">
                    {currentIndex + 1} / {totalCards}
                  </span>
                  <button 
                    onClick={handleNext}
                    disabled={currentIndex === totalCards - 1}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Confidence Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleSetDifficulty('Hard')}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-950/20 text-xs font-bold transition-all ${
                      activeDifficulty === 'Hard'
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/10'
                        : 'bg-white dark:bg-darkbg-card hover:bg-red-50 dark:hover:bg-red-950/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    🔴 Hard
                  </button>
                  <button
                    onClick={() => handleSetDifficulty('Medium')}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-950/20 text-xs font-bold transition-all ${
                      activeDifficulty === 'Medium'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                        : 'bg-white dark:bg-darkbg-card hover:bg-amber-50 dark:hover:bg-amber-950/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    🟡 Medium
                  </button>
                  <button
                    onClick={() => handleSetDifficulty('Easy')}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-green-200 dark:border-green-950/20 text-xs font-bold transition-all ${
                      activeDifficulty === 'Easy'
                        ? 'bg-green-500 text-white shadow-md shadow-green-500/10'
                        : 'bg-white dark:bg-darkbg-card hover:bg-green-50 dark:hover:bg-green-950/10 text-green-600 dark:text-green-400'
                    }`}
                  >
                    🟢 Easy
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANEL (4 Columns) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Progress Card */}
          <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Session Mastery</h3>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{masteryPercentage}%</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Card review completion</p>
              </div>
              <div className="flex items-center space-x-1.5 bg-orange-50 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400 rounded-xl px-3 py-1.5 border border-orange-100/50 dark:border-orange-900/20">
                <Flame className="h-4 w-4 fill-current animate-pulse" />
                <span className="text-xs font-bold">{streak} Day Streak</span>
              </div>
            </div>

            {/* Learning progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>PROGRESS BAR</span>
                <span>{completedCount} / {totalCards} Cards</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${masteryPercentage}%` }} />
              </div>
            </div>

            {/* Classification breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
              <div className="text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl p-2">
                <p className="text-xs font-bold text-green-500">{difficultyCounts.Easy}</p>
                <p className="text-[9px] font-bold text-slate-400">Easy</p>
              </div>
              <div className="text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl p-2">
                <p className="text-xs font-bold text-amber-500">{difficultyCounts.Medium}</p>
                <p className="text-[9px] font-bold text-slate-400">Med</p>
              </div>
              <div className="text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl p-2">
                <p className="text-xs font-bold text-red-500">{difficultyCounts.Hard}</p>
                <p className="text-[9px] font-bold text-slate-400">Hard</p>
              </div>
            </div>
          </div>

          {/* Upcoming Topics Card */}
          {upcomingTopics.length > 0 && (
            <div className="rounded-2xl bg-white p-5 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-3 animate-slide-in">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4.5 w-4.5 text-purple-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Active Week Topics</h3>
              </div>
              <ul className="space-y-2.5">
                {upcomingTopics.map((topic, index) => {
                  const done = isTopicCompleted(topic);
                  return (
                    <li key={index} className="flex items-center justify-between text-xs p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleTopic(topic)}
                          className={`flex h-4.5 w-4.5 items-center justify-center rounded border transition-all ${
                            done 
                              ? 'bg-accent border-accent text-white' 
                              : 'border-slate-300 dark:border-slate-700 hover:border-accent text-transparent bg-white dark:bg-darkbg-card'
                          }`}
                        >
                          <Check className="h-3 w-3 stroke-[3]" />
                        </button>
                        <span className={`truncate text-slate-700 dark:text-slate-300 font-semibold ${done ? 'line-through opacity-45' : ''}`}>
                          {topic}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM SECTION (Stats & Tip & Shortcuts) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Quick Stats Card */}
        <div className="rounded-2xl bg-white p-4 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-center space-x-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Study Goal</p>
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">100% card retrieval today</p>
          </div>
        </div>

        {/* Study Tip Card */}
        <div className="rounded-2xl bg-white p-4 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-start space-x-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 flex-shrink-0">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Study Tip</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 font-medium">
              {studyTips[currentIndex % studyTips.length]}
            </p>
          </div>
        </div>

        {/* Keyboard Shortcuts Card */}
        <div className="rounded-2xl bg-white p-4 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm flex items-start space-x-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 flex-shrink-0">
            <Keyboard className="h-5 w-5" />
          </span>
          <div className="space-y-1.5 w-full">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keyboard Shortcuts</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-bold text-slate-500">
              <div className="flex justify-between border-b border-slate-50 pb-0.5 dark:border-slate-800"><span className="text-slate-400">Flip card</span><span className="bg-slate-100 px-1 rounded dark:bg-slate-900">Space</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-0.5 dark:border-slate-800"><span className="text-slate-400">Easy</span><span className="bg-slate-100 px-1 rounded dark:bg-slate-900">3 Key</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-0.5 dark:border-slate-800"><span className="text-slate-400">Prev card</span><span className="bg-slate-100 px-1 rounded dark:bg-slate-900">← Arrow</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-0.5 dark:border-slate-800"><span className="text-slate-400">Medium</span><span className="bg-slate-100 px-1 rounded dark:bg-slate-900">2 Key</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-0.5 dark:border-slate-800"><span className="text-slate-400">Next card</span><span className="bg-slate-100 px-1 rounded dark:bg-slate-900">→ Arrow</span></div>
              <div className="flex justify-between border-b border-slate-50 pb-0.5 dark:border-slate-800"><span className="text-slate-400">Hard</span><span className="bg-slate-100 px-1 rounded dark:bg-slate-900">1 Key</span></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Flashcards;
