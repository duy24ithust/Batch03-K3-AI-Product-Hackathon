'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface QuickSummarySectionProps {
  bullets: string[];
}

export const QuickSummarySection: React.FC<QuickSummarySectionProps> = ({ bullets }) => {
  return (
    <div className="p-4 bg-blue-50/60 dark:bg-slate-800/60 rounded-xl border border-blue-100 dark:border-slate-800 space-y-3">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
          1. Quick Summary
        </h3>
      </div>

      <ul className="space-y-2">
        {bullets.map((point, i) => (
          <li
            key={i}
            className="flex items-start space-x-2.5 text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 flex-shrink-0" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
