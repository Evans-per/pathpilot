import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Play, 
  CheckCircle,
  HelpCircle,
  FileText,
  Award,
  Sparkles,
  X,
  Lock,
  Calendar,
  Layers,
  BookOpen
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const RoadmapView = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState(1);
  const [error, setError] = useState('');

  // AI Project Ideas State
  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [showIdeasModal, setShowIdeasModal] = useState(false);
  const [ideasError, setIdeasError] = useState('');
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState(0);
  const [activeIdeasWeek, setActiveIdeasWeek] = useState(null);

  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const pdfRef = useRef(null);

  useEffect(() => {
    const fetchRoadmapAndProgress = async () => {
      try {
        const roadmapRes = await api.get('/roadmap');
        if (roadmapRes.data && roadmapRes.data.success) {
          setRoadmap(roadmapRes.data.roadmap);
        }

        const dashboardRes = await api.get('/dashboard');
        if (dashboardRes.data && dashboardRes.data.success) {
          setCompletedTasks(dashboardRes.data.completedTasks || []);
        }
      } catch (err) {
        console.error('Error fetching roadmap:', err);
        setError('Roadmap details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmapAndProgress();
  }, []);

  const handleToggleTask = async (week, taskType, taskName) => {
    try {
      const res = await api.post('/complete-task', {
        week,
        taskType,
        taskName,
        studyHours: taskType === 'topic' ? 1.5 : 2.0
      });

      if (res.data && res.data.success) {
        setCompletedTasks(res.data.completedTasks || []);
        refreshProfile();
      }
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  const isCompleted = (week, taskType, taskName) => {
    return completedTasks.some(
      t => t.week === week && t.taskType === taskType && t.taskName.toLowerCase() === taskName.toLowerCase()
    );
  };

  const handleWatchVideo = (topic) => {
    navigate('/videos', { state: { query: topic } });
  };

  const handleGetProjectIdeas = async (week) => {
    setActiveIdeasWeek(week);
    setShowIdeasModal(true);
    setIdeasLoading(true);
    setIdeasError('');
    setSelectedIdeaIndex(0);
    try {
      const res = await api.post('/ai/project-ideas', { week });
      if (res.data?.ideas) {
        setIdeas(res.data.ideas);
      } else {
        throw new Error('No ideas returned from the server.');
      }
    } catch (err) {
      setIdeasError(err.response?.data?.message || 'Failed to generate AI project ideas. Please try again.');
    } finally {
      setIdeasLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    setExporting(true);
    const currentExpanded = expandedWeek;
    setExpandedWeek(null);

    setTimeout(async () => {
      try {
        const element = pdfRef.current;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`PathPilot_Roadmap_${roadmap.summary.substring(0, 15).replace(/\s+/g, '_')}.pdf`);
      } catch (err) {
        console.error('PDF export failed:', err);
      } finally {
        setExpandedWeek(currentExpanded);
        setExporting(false);
      }
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-bold">{error || 'No learning roadmap found. Create one on the dashboard.'}</p>
      </div>
    );
  }

  // ── ACTIVE WEEK CALCULATOR ──
  let activeWeekNum = 1;
  const totalWeeksCount = roadmap.roadmap.length;
  for (let w = 1; w <= totalWeeksCount; w++) {
    const weekData = roadmap.roadmap.find(item => item.week === w);
    if (!weekData) continue;
    const weekTotalItems = weekData.topics.length + weekData.practice.length + (weekData.mini_project ? 1 : 0);
    const weekCompletedCount = completedTasks.filter(t => t.week === w).length;
    if (weekCompletedCount < weekTotalItems) {
      activeWeekNum = w;
      break;
    }
    activeWeekNum = totalWeeksCount;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-slide-in">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/60 dark:border-darkbg-border">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl font-sans">Study Roadmap</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Interactive timeline of your learning curriculum and milestones.</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="inline-flex items-center justify-center rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white shadow-lg hover:bg-slate-950 dark:bg-accent dark:hover:bg-accent-dark transition-all disabled:opacity-50"
        >
          <Download className="mr-1.5 h-4.5 w-4.5" />
          <span>{exporting ? 'Generating PDF...' : 'Export PDF'}</span>
        </button>
      </div>

      {/* Timeline Wrapper */}
      <div ref={pdfRef} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border shadow-sm space-y-6">
        
        {/* Export Banner Summary */}
        <div className="pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-indigo-500/10">
              <FileText className="h-4.5 w-4.5" />
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">PathPilot AI Curriculum Overview</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed max-w-2xl">
            {roadmap.summary}
          </p>
        </div>

        {/* Vertical Timeline track */}
        <div className="relative pl-6 md:pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-8">
          {roadmap.roadmap.map((weekData) => {
            const isWeekExpanded = expandedWeek === weekData.week || expandedWeek === null;
            const weekCompletedCount = completedTasks.filter(t => t.week === weekData.week).length;
            const weekTotalCount = weekData.topics.length + weekData.practice.length + (weekData.mini_project ? 1 : 0);
            
            const isWeekFullyDone = weekCompletedCount === weekTotalCount && weekTotalCount > 0;
            const isWeekCurrent = weekData.week === activeWeekNum;
            const isWeekLocked = weekData.week > activeWeekNum;

            // Define status text & styling
            let statusText = 'Locked';
            let statusBadgeCls = 'text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 border-transparent';
            if (isWeekFullyDone) {
              statusText = 'Completed';
              statusBadgeCls = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            } else if (isWeekCurrent) {
              statusText = 'Current';
              statusBadgeCls = 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 dark:text-blue-400';
            }

            return (
              <div key={weekData.week} className="relative">
                
                {/* Timeline Dot Indicator */}
                <span className={`absolute -left-[35px] md:-left-[43px] top-1.5 flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full border-2 transition-all ${
                  isWeekFullyDone
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : isWeekCurrent
                    ? 'bg-accent border-accent text-white shadow-md shadow-indigo-500/10 animate-pulse'
                    : 'bg-white border-slate-200 text-slate-400 dark:bg-darkbg-card dark:border-slate-800'
                }`}>
                  {isWeekFullyDone ? (
                    <CheckCircle className="h-4.5 w-4.5 fill-current text-white" />
                  ) : isWeekLocked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <span className="text-[10px] font-extrabold">{weekData.week}</span>
                  )}
                </span>

                {/* Week Layout Box */}
                <div 
                  className={`rounded-2xl border transition-all duration-300 ${
                    isWeekExpanded 
                      ? 'border-accent bg-accent/[0.01] dark:border-slate-800 dark:bg-slate-900/10' 
                      : 'border-slate-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card'
                  } ${isWeekLocked ? 'opacity-65' : ''}`}
                >
                  {/* Week Header */}
                  <div 
                    onClick={() => {
                      if (!isWeekLocked) {
                        setExpandedWeek(expandedWeek === weekData.week ? null : weekData.week);
                      }
                    }}
                    className={`flex items-center justify-between p-4 md:p-5 select-none ${isWeekLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-snug">
                            {weekData.goal}
                          </h3>
                          <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusBadgeCls}`}>
                            {statusText}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                          {weekCompletedCount} of {weekTotalCount} items completed • {weekData.estimated_hours} Hours studied goal
                        </p>
                      </div>
                    </div>
                    
                    {!isWeekLocked && (
                      <button className="rounded-lg p-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
                        {isWeekExpanded ? <ChevronUp className="h-4.5 w-4.5 text-slate-400" /> : <ChevronDown className="h-4.5 w-4.5 text-slate-400" />}
                      </button>
                    )}
                  </div>

                  {/* Week Content Body */}
                  {isWeekExpanded && !isWeekLocked && (
                    <div className="px-4 pb-5 md:px-6 md:pb-6 border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-5 animate-slide-in">
                      
                      {/* Topics */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> Lessons & Videos
                        </h4>
                        <div className="grid gap-2.5">
                          {weekData.topics.map((topic, idx) => {
                            const done = isCompleted(weekData.week, 'topic', topic);
                            return (
                              <div 
                                key={idx}
                                className="flex items-center justify-between rounded-xl bg-slate-50/50 p-3 border border-slate-100 dark:bg-darkbg dark:border-slate-850 hover:border-slate-200 transition-colors"
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={done}
                                    onChange={() => handleToggleTask(weekData.week, 'topic', topic)}
                                    className="h-4.5 w-4.5 accent-accent rounded border-slate-350"
                                  />
                                  <span className={`text-xs font-semibold truncate ${done ? 'text-slate-400 line-through dark:text-slate-650' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {topic}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleWatchVideo(topic)}
                                  className="flex items-center space-x-1 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[10px] font-bold text-accent hover:bg-accent hover:text-white transition-all dark:bg-accent/20 dark:text-blue-400 dark:hover:bg-accent flex-shrink-0"
                                >
                                  <Play className="h-3 w-3 fill-current" />
                                  <span>Watch video</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Concepts */}
                      {weekData.concepts && weekData.concepts.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Layers className="h-3 w-3" /> Core Concepts
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {weekData.concepts.map((concept, idx) => (
                              <span 
                                key={idx}
                                className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-slate-200/40 dark:border-slate-850/60"
                              >
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Practice */}
                      {weekData.practice && weekData.practice.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Challenges
                          </h4>
                          <div className="grid gap-2">
                            {weekData.practice.map((task, idx) => {
                              const done = isCompleted(weekData.week, 'practice', task);
                              return (
                                <div 
                                  key={idx}
                                  className="flex items-center space-x-3 rounded-xl bg-slate-50/30 p-3 border border-slate-100 dark:bg-darkbg/40 dark:border-slate-850/60"
                                >
                                  <input
                                    type="checkbox"
                                    checked={done}
                                    onChange={() => handleToggleTask(weekData.week, 'practice', task)}
                                    className="h-4.5 w-4.5 accent-accent rounded border-slate-350"
                                  />
                                  <span className={`text-xs ${done ? 'text-slate-400 line-through dark:text-slate-650' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
                                    {task}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Mini Project */}
                      {weekData.mini_project && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Award className="h-3 w-3" /> Milestone Project
                            </h4>
                            <button
                              onClick={() => handleGetProjectIdeas(weekData.week)}
                              className="inline-flex items-center text-[10px] font-bold text-accent hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1" />
                              <span>AI Project Ideas & Challenges</span>
                            </button>
                          </div>
                          {(() => {
                            const done = isCompleted(weekData.week, 'mini_project', weekData.mini_project);
                            return (
                              <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-4 dark:border-amber-950/10 dark:bg-amber-950/5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={done}
                                      onChange={() => handleToggleTask(weekData.week, 'mini_project', weekData.mini_project)}
                                      className="mt-1 h-4.5 w-4.5 accent-amber-500 rounded border-amber-305"
                                    />
                                    <div>
                                      <h5 className={`text-xs font-bold text-slate-800 dark:text-slate-200 ${done ? 'text-slate-400 line-through dark:text-slate-650' : ''}`}>
                                        {weekData.mini_project.split(' - ')[0]}
                                      </h5>
                                      <p className={`text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed ${done ? 'text-slate-400 line-through dark:text-slate-650' : ''}`}>
                                        {weekData.mini_project.split(' - ')[1] || weekData.mini_project}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 flex-shrink-0">
                                    <Award className="h-4.5 w-4.5" />
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Project Ideas Modal */}
      {showIdeasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-darkbg-card border border-slate-100 dark:border-darkbg-border shadow-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto flex flex-col space-y-5 animate-slide-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-accent dark:text-blue-400">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">AI Project Ideas & Challenges</h2>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                  Week {activeIdeasWeek} Challenges · Tailored to your learning path
                </p>
              </div>
              <button 
                onClick={() => setShowIdeasModal(false)}
                className="rounded-xl border border-slate-150 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition-all"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Content */}
            {ideasLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold animate-pulse">Generating project ideas and guidelines…</p>
              </div>
            ) : ideasError ? (
              <div className="rounded-xl bg-red-50 p-4 text-center text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
                {ideasError}
              </div>
            ) : (
              <div className="space-y-6">
                {/* 3 Difficulty Options */}
                <div className="grid gap-3 md:grid-cols-3">
                  {ideas.map((idea, idx) => {
                    const diffColors = {
                      Easy:   'text-green-650 border-green-200 bg-green-50/50 dark:bg-green-950/15',
                      Medium: 'text-amber-650 border-amber-200 bg-amber-50/50 dark:bg-amber-950/15',
                      Hard:   'text-red-650 border-red-200 bg-red-50/50 dark:bg-red-950/15'
                    };
                    const isSelected = selectedIdeaIndex === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedIdeaIndex(idx)}
                        className={`text-left rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between h-40 ${
                          isSelected
                            ? 'border-accent bg-accent/[0.02] shadow-sm shadow-accent/5 dark:border-blue-500'
                            : 'border-slate-200/60 dark:border-slate-800 dark:bg-slate-900/10 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${diffColors[idea.difficulty] || ''}`}>
                              {idea.difficulty}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-snug line-clamp-2">
                            {idea.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                            {idea.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Idea Details */}
                {ideas[selectedIdeaIndex] && (
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4 bg-slate-50/30 dark:bg-slate-900/10 animate-slide-in">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
                        {ideas[selectedIdeaIndex].title}
                      </h3>
                      <div className="rounded-xl border border-dashed border-indigo-100 bg-indigo-50/10 p-3 mt-3">
                        <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider text-[9px]">The Core Challenge</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1 font-medium">
                          {ideas[selectedIdeaIndex].challenge}
                        </p>
                      </div>
                    </div>

                    {/* Expected Outcomes */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Learning Outcomes</p>
                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {ideas[selectedIdeaIndex].key_outcomes?.map((out, oIdx) => (
                          <li key={oIdx} className="flex items-start text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent mt-2 mr-2.5 flex-shrink-0" />
                            <span>{out}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Implementation Steps */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Step-by-Step Guidelines</p>
                      <ol className="space-y-2">
                        {ideas[selectedIdeaIndex].steps?.map((step, sIdx) => (
                          <li key={sIdx} className="flex items-start text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-400 mr-2.5 flex-shrink-0">
                              {sIdx + 1}
                            </span>
                            <span className="pt-0.5 text-left">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapView;
