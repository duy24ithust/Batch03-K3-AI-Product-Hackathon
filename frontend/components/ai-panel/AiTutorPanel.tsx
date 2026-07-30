'use client';

import React from 'react';
import {
  MessageSquare,
  FileText,
  HelpCircle,
  PanelRightClose,
  Sparkles,
  Zap
} from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { ChatTab } from './ChatTab';
import { SummaryTab } from '../summary/SummaryTab';
import { QuizTab } from '../quiz/QuizTab';
import { AiTabType } from '../../types';

export const AiTutorPanel: React.FC = () => {
  const {
    isAiPanelOpen,
    toggleAiPanel,
    aiPanelWidth,
    activeAiTab,
    setActiveAiTab,
    questionsUsed,
    questionsLimit
  } = usePlatformStore();

  if (!isAiPanelOpen) {
    return null;
  }

  const tabs: { id: AiTabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className="w-3.5 h-3.5" />
    },
    {
      id: 'summary',
      label: 'Summary',
      icon: <FileText className="w-3.5 h-3.5" />
    },
    {
      id: 'quiz',
      label: 'Quiz',
      icon: <HelpCircle className="w-3.5 h-3.5" />
    }
  ];

  const quotaPercentage = Math.round((questionsUsed / questionsLimit) * 100);

  return (
    <aside
      style={{ width: aiPanelWidth }}
      className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 transition-all duration-200 select-none flex-shrink-0 relative shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight flex items-center space-x-1.5">
              <span>AI Tutor</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                Context-Aware
              </span>
            </h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              VLearn Assistant
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleAiPanel}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title="Collapse AI Panel"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-3 pt-2 pb-2 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
        <div className="flex-1 grid grid-cols-3 gap-1 bg-gray-200/70 dark:bg-slate-800 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveAiTab(tab.id)}
              className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeAiTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeAiTab === 'chat' && <ChatTab />}
        {activeAiTab === 'summary' && <SummaryTab />}
        {activeAiTab === 'quiz' && <QuizTab />}
      </div>

      {/* Footer: Daily Quota Indicator */}
      <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-900/80 border-t border-gray-200 dark:border-slate-800 text-[11px]">
        <div className="flex items-center justify-between font-semibold text-gray-700 dark:text-gray-300 mb-1">
          <span className="flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Daily Quota</span>
          </span>
          <span>
            {questionsUsed} / {questionsLimit} Questions
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
