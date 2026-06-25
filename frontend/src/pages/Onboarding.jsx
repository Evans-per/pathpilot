import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Sparkles, 
  ChevronRight, 
  Brain, 
  Terminal, 
  Globe, 
  Database, 
  BarChart, 
  CheckCircle,
  HelpCircle,
  GraduationCap
} from 'lucide-react';

const Onboarding = () => {
  const { submitOnboarding, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Form States
  const [interest, setInterest] = useState('Web Development');
  const [level, setLevel] = useState('Beginner');
  const [deadlineValue, setDeadlineValue] = useState(4);
  const [deadlineUnit, setDeadlineUnit] = useState('weeks');
  const [dailyHours, setDailyHours] = useState(2);
  const [learningStyle, setLearningStyle] = useState('Mixed');
  const [existingSkills, setExistingSkills] = useState('');

  // UI Flow States
  const [step, setStep] = useState(1); // 1 = Questionnaire, 2 = Generating Loading
  const [loadingMsg, setLoadingMsg] = useState('Consulting AI roadmap designers...');
  const [error, setError] = useState('');

  // Interests list
  const interestsList = [
    { name: 'Web Development', desc: 'HTML, CSS, React, Express, Fullstack', icon: Globe },
    { name: 'AI & Machine Learning', desc: 'Python, Neural Networks, PyTorch, LLMs', icon: Brain },
    { name: 'Software Engineering', desc: 'Git, DSA, System Design, Architecture', icon: Terminal },
    { name: 'Data Science', desc: 'EDA, Pandas, Big Data, SQL Analytics', icon: BarChart },
    { name: 'DSA', desc: 'Algorithms, Data Structures, Complexity', icon: GraduationCap }
  ];

  // Levels list
  const levelsList = [
    { name: 'Beginner', desc: 'No prior programming exposure.' },
    { name: 'Intermediate', desc: 'Understand basics, want to build apps.' },
    { name: 'Advanced', desc: 'Looking to master architectures & speed.' }
  ];

  // Learning Styles list
  const stylesList = ['Videos', 'Reading', 'Projects', 'Mixed'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const onboardingPayload = {
      interest,
      level,
      deadlineValue,
      deadlineUnit,
      dailyHours,
      learningStyle,
      existingSkills
    };

    setStep(2); // Show loading screen

    // Run humorous, informative loading interval
    const messages = [
      'Structuring weekly topics...',
      'Sorting practice tasks by relevance...',
      'Filtering out 10-second YouTube shorts...',
      'Ranking full-length educational crash courses...',
      'Initializing chatbot context models...',
      'Validating roadmap curriculum completeness...',
      'Deploying capstone project guidelines...'
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      if (msgIdx < messages.length) {
        setLoadingMsg(messages[msgIdx]);
        msgIdx++;
      }
    }, 2500);

    try {
      // 1. Submit onboarding questionnaire answers
      const onboardRes = await submitOnboarding(onboardingPayload);
      if (!onboardRes.success) {
        clearInterval(interval);
        setStep(1);
        return setError(onboardRes.message);
      }

      // 2. Trigger OpenAI roadmap generator (caches automatically in MongoDB)
      const genRes = await api.post('/generate-roadmap');
      
      clearInterval(interval);
      if (genRes.data && genRes.data.success) {
        // Fetch updated profile with onboardingCompleted: true
        await refreshProfile();
        // Go straight to dashboard
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      clearInterval(interval);
      setStep(1);
      setError(err.response?.data?.message || 'AI generator failed. Please retry.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkbg px-4 py-12">
      {/* BACKGROUND GRAPHIC */}
      <div className="absolute top-0 right-1/4 h-[300px] w-[300px] rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-600/5"></div>

      {/* STEP 1: INTERACTIVE QUESTIONNAIRE */}
      {step === 1 && (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-darkbg-border animate-slide-in space-y-6">
          <div className="text-center">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold dark:bg-accent/20 dark:text-blue-400">
              <GraduationCap className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">Design Your Learning Path</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Provide your timeline and learning style so PathPilot AI can customize your roadmap.</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
              {error}
            </div>
          )}

          {/* CUSTOM INTEREST TEXT INPUT */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400" htmlFor="custom-interest">
              1. What would you like to learn?
            </label>
            <input
              id="custom-interest"
              type="text"
              required
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              placeholder="e.g. Next.js, Cyber Security, Python for Finance, French Cooking..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
            />
            {/* Suggestion pills */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Suggestions:</span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {['Blender 3D', '3D Animation', 'Unity Game Dev', 'Cybersecurity', 'Docker & DevOps', 'React', 'AI & ML', 'UI/UX Design', 'Data Structures', 'Python for Finance', 'Next.js', 'Mobile Apps'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInterest(s)}
                    className={`rounded-full px-3 py-1 text-[9px] font-bold transition-all border ${
                      interest.toLowerCase() === s.toLowerCase()
                        ? 'bg-accent text-white border-accent dark:bg-accent'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* LEVEL cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">2. Current Experience Level</label>
              <div className="space-y-2">
                {levelsList.map((item) => (
                  <div
                    key={item.name}
                    onClick={() => setLevel(item.name)}
                    className={`flex items-center space-x-3 rounded-xl border p-3 cursor-pointer transition-all ${
                      level === item.name
                        ? 'border-accent bg-accent/5 dark:border-blue-400 dark:bg-blue-950/15'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className={`h-2 w-2 rounded-full ${level === item.name ? 'bg-accent dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</h4>
                      <p className="text-[9px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TIMELINE & HOURS */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">3. Project Deadline</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={deadlineValue}
                    onChange={(e) => setDeadlineValue(e.target.value)}
                    className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
                  />
                  <select
                    value={deadlineUnit}
                    onChange={(e) => setDeadlineUnit(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
                  >
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">4. Daily Study Budget</label>
                  <span className="text-xs font-bold text-accent dark:text-blue-400">{dailyHours} Hours/Day</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  className="w-full accent-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">5. Preferred Learning Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {stylesList.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setLearningStyle(style)}
                      className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                        learningStyle === style
                          ? 'border-accent bg-accent/5 text-accent dark:border-blue-400 dark:bg-blue-950/15 dark:text-blue-400'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">6. Existing Skills (Optional)</label>
            <input
              type="text"
              value={existingSkills}
              onChange={(e) => setExistingSkills(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs focus:border-accent focus:outline-none dark:border-slate-800 dark:bg-darkbg dark:text-white"
              placeholder="e.g. JavaScript, Basic HTML, SQL (Comma separated)"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center rounded-xl bg-accent py-3.5 font-extrabold text-white shadow-xl shadow-accent/20 hover:bg-accent-dark transition-all duration-300"
          >
            <span>Generate Roadmap</span>
            <ChevronRight className="ml-2 h-5 w-5" />
          </button>
        </form>
      )}

      {/* STEP 2: GENERATING SCREEN WITH DYNAMIC TIPS */}
      {step === 2 && (
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl border border-slate-100 text-center dark:bg-slate-900 dark:border-darkbg-border animate-slide-in">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent mb-6 dark:bg-accent/20">
            <Sparkles className="h-10 w-10 animate-pulse text-accent dark:text-blue-400" />
            <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Assembling Your Curriculum</h3>
          <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium animate-pulse">
            {loadingMsg}
          </p>

          <div className="mt-8 rounded-xl bg-slate-50 p-4 border border-slate-100 dark:bg-darkbg-card dark:border-darkbg-border text-left">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">💡 Study Tip</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              We score videos based on views, likes, recentness, and top education channels. Shorter clips are automatically filtered out to ensure you receive rich, end-to-end guidance!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
