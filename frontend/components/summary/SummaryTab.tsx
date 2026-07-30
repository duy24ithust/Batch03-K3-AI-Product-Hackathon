'use client';

import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Sparkles } from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { aiService } from '../../services/aiService';
import { LessonSummary, SummaryScope } from '../../types';
import { QuickSummarySection } from './QuickSummarySection';
import { KeyConceptsGrid } from './KeyConceptsGrid';
import { LearningObjectivesList } from './LearningObjectivesList';
import { ImportantTermsBadges } from './ImportantTermsBadges';
import { KeyTakeawaysBox } from './KeyTakeawaysBox';
import { ReadingMetadata } from './ReadingMetadata';

export const SummaryTab: React.FC = () => {
  const { summaryScope, setSummaryScope, selectedDocId, currentPage } = usePlatformStore();
  const [summaryData, setSummaryData] = useState<LessonSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchSummary = async (scope: SummaryScope) => {
    setIsLoading(true);
    try {
      const data = await aiService.getLessonSummary(scope);
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(summaryScope);
  }, [summaryScope, selectedDocId, currentPage]);

  const handleCopy = () => {
    if (!summaryData) return;
    const text = `# Lesson Summary (${summaryScope})\n\n## Quick Summary\n` +
      summaryData.quickSummary.map((p) => `- ${p}`).join('\n') +
      `\n\n## Key Takeaway\n${summaryData.keyTakeaways}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scopes: { id: SummaryScope; label: string }[] = [
    { id: 'slide', label: 'Current Slide' },
    { id: 'chapter', label: 'Current Chapter' },
    { id: 'lesson', label: 'Entire Lesson' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 select-none">
      {/* Top Scope Selector Bar */}
      <div className="p-3 bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-800 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Summary Scope
          </span>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => fetchSummary(summaryScope)}
              disabled={isLoading}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
              title="Regenerate Summary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
              title="Copy Summary Markdown"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scope Radio Pill buttons */}
        <div className="grid grid-cols-3 gap-1 bg-gray-200/70 dark:bg-slate-800 p-1 rounded-xl">
          {scopes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSummaryScope(s.id)}
              className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                summaryScope === s.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full border ${
                  summaryScope === s.id
                    ? 'bg-blue-600 border-blue-600 dark:bg-blue-400 dark:border-blue-400'
                    : 'border-gray-400 dark:border-gray-500'
                }`}
              />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary 6 Sections Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {isLoading || !summaryData ? (
          <div className="py-16 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Generating AI Lesson Summary for scope: <strong className="uppercase">{summaryScope}</strong>...
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 1. Quick Summary */}
            <QuickSummarySection bullets={summaryData.quickSummary} />

            {/* 2. Key Concepts */}
            <KeyConceptsGrid concepts={summaryData.keyConcepts} />

            {/* 3. Learning Objectives */}
            <LearningObjectivesList objectives={summaryData.learningObjectives} />

            {/* 4. Important Terms */}
            <ImportantTermsBadges terms={summaryData.importantTerms} />

            {/* 5. Key Takeaways */}
            <KeyTakeawaysBox takeaway={summaryData.keyTakeaways} />

            {/* 6. Reading Information */}
            <ReadingMetadata info={summaryData.readingInfo} />
          </div>
        )}
      </div>
    </div>
  );
};
