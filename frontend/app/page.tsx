'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  MessageSquare,
  FileText,
  HelpCircle,
  Layers,
  CheckCircle2,
  Zap,
  Code
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      title: 'Interactive Slide Viewer',
      description: 'Study PDF slide decks with built-in highlight markers, freehand drawing pen, and draggable sticky notes.'
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-indigo-600" />,
      title: 'Context-Aware AI Tutor',
      description: 'Ask questions that automatically include your current document, page number, and highlighted text.'
    },
    {
      icon: <FileText className="w-6 h-6 text-emerald-600" />,
      title: 'Multi-Scope Lesson Summaries',
      description: 'Generate structured summaries for your current slide, chapter, or entire lesson with key concepts and objectives.'
    },
    {
      icon: <HelpCircle className="w-6 h-6 text-amber-600" />,
      title: 'Adaptive Practice Quizzes',
      description: 'Test your understanding with instant Multiple Choice, True/False, and Fill-in-the-Blank questions.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-sans flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            VLearn<span className="text-blue-500">.ai</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors hidden sm:flex items-center space-x-1"
          >
            <Code className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-105 flex items-center space-x-2"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold animate-pulse">
          <Zap className="w-3.5 h-3.5" />
          <span>Next-Generation Agentic AI Learning Experience</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Master Any Slide Deck with an <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Intelligent AI Learning Companion
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
          A sleek, Notion & Linear inspired three-column learning platform designed for students. Study slide decks, highlight key passages, generate structured lesson summaries, and test your retention with adaptive AI quizzes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-blue-500/25 transition-all hover:scale-105 flex items-center justify-center space-x-2"
          >
            <span>Enter Learning Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-base transition-all flex items-center justify-center"
          >
            Explore Features
          </a>
        </div>

        {/* Preview Highlights Pill Bar */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          {[
            '3-Column SaaS Architecture',
            'Context-Aware LLM Chat',
            'Slide & Chapter Summaries',
            'Pluggable API Key Support'
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-medium text-slate-300"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Feature Grid Section */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Designed for High-Retention Studying
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Every feature is engineered to turn passive reading into active mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="p-3 rounded-xl bg-slate-800/80 w-fit">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500">
        <p>
          © 2026 VLearn AI Learning Platform • Hackathon Prototype Built with Next.js 15, Tailwind CSS & Zustand
        </p>
      </footer>
    </div>
  );
}
