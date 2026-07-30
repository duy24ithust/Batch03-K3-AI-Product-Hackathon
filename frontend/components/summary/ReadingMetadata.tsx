'use client';

import React from 'react';
import { Clock, BarChart2, BookOpen, FileText } from 'lucide-react';
import { LessonSummary } from '../../types';

interface ReadingMetadataProps {
  info: LessonSummary['readingInfo'];
}

export const ReadingMetadata: React.FC<ReadingMetadataProps> = ({ info }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 rounded-lg bg-gray-700 dark:bg-gray-600 text-white shadow-xs">
          <BookOpen className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          6. Reading Information
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xs text-center">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase">
            Est. Reading Time
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {info.estimatedTimeMinutes} minutes
          </p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xs text-center">
          <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase">
            Difficulty
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {info.difficulty}
          </p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xs text-center">
          <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase">
            Word Count
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {info.wordCount.toLocaleString()}
          </p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xs text-center">
          <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase">
            Total Pages
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {info.totalPages} pages
          </p>
        </div>
      </div>
    </div>
  );
};
