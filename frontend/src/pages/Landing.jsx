import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, BookOpen, Clock, Compass } from 'lucide-react';

const Landing = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-darkbg">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/10"></div>
      <div className="absolute bottom-20 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl dark:bg-accent/5"></div>

      {/* Header Brand */}
      <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">
              Path<span className="text-accent">Pilot</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
              Log In
            </Link>
            <Link to="/signup" className="rounded-xl bg-accent px-4.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/15 hover:bg-accent-dark transition-all duration-200">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Hero Left Content */}
          <div className="space-y-8 animate-slide-in">
            <div className="inline-flex items-center space-x-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent dark:bg-accent/20 dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              <span>Next-Gen Personalized AI Learning</span>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl leading-tight">
              Navigate Your Path to <span className="gradient-text">Skill Mastery</span>
            </h1>

            <p className="text-base text-slate-500 dark:text-slate-400 md:text-lg leading-relaxed max-w-lg">
              PathPilot generates customized step-by-step roadmaps, structures your daily study hours, filters top-ranked educational videos, and answers doubts.
            </p>

            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Link
                to="/signup"
                className="flex items-center justify-center rounded-xl bg-accent px-6 py-3.5 font-bold text-white shadow-xl shadow-accent/25 hover:bg-accent-dark hover:translate-x-0.5 transition-all"
              >
                <span>Generate Free Roadmap</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-6 py-3.5 font-bold text-slate-700 backdrop-blur-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900 transition-all"
              >
                <span>Check Demo Portal</span>
              </Link>
            </div>

            {/* Micro stats banner */}
            <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800 grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">100%</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">AI Personalized</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">15m+</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Filtered Courses</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">24/7</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">AI Study Buddy</p>
              </div>
            </div>
          </div>

          {/* Hero Right Visual mockup (Card deck stack) */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[460px] rounded-3xl bg-white p-6 shadow-2xl border border-slate-200/50 dark:bg-slate-900 dark:border-darkbg-border">
              {/* Fake Dashboard header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">Active Timeline</span>
              </div>

              {/* Fake Roadmap content */}
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-blue-50/50 p-4 border border-blue-100/50 dark:bg-blue-950/10 dark:border-blue-900/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-accent uppercase tracking-wider">Week 1: Fundamentals</span>
                    <span className="text-[10px] font-bold text-slate-400">12 Study Hours</span>
                  </div>
                  <h4 className="mt-1 font-bold text-slate-800 dark:text-slate-200 text-sm">Core Syntax & Event Loops</h4>
                  <ul className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <li className="flex items-center"><Play className="mr-2 h-3.5 w-3.5 text-accent" /> Watch: ES6 Advanced scope video</li>
                    <li className="flex items-center"><BookOpen className="mr-2 h-3.5 w-3.5 text-accent" /> Topic: Asynchronous structures</li>
                    <li className="flex items-center"><Clock className="mr-2 h-3.5 w-3.5 text-accent" /> Practice: Write Promise chaining demo</li>
                  </ul>
                </div>
                
                <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Week 2: Advanced Layouts</span>
                  </div>
                  <h4 className="mt-1 font-bold text-slate-700 dark:text-slate-300 text-sm">Responsive Component Designs</h4>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800 opacity-60">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Week 3: State Integration</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
