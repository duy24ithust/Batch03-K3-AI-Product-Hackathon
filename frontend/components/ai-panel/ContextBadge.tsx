'use client';

import React from 'react';
import { BookOpen, X, Sparkles } from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';

export const ContextBadge: React.FC = () => {
  const { days, selectedDocId, currentPage, selectedText, setSelectedText } =
    usePlatformStore();

  const activeDoc = days
    .flatMap((d) => d.documents)
    .find((doc) => doc.id === selectedDocId);

  const activeDay = days.find((d) => d.id === activeDoc?.dayId);
  const currentSlide = activeDoc?.slides[currentPage - 1];

  return (
    <div className="px-4 py-2.5 bg-blue-50/70 dark:bg-slate-900/90 border-b border-blue-100 dark:border-slate-800 space-y-1.5 select-none">
      {/* Primary Context Line */}
      <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-300">
        <div className="flex items-center space-x-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 animate-pulse" />
          <span className="truncate">
            Day {activeDay?.dayNumber || 1} • {activeDoc?.filename || 'Document'}
          </span>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-2xs border border-blue-200 dark:border-slate-700 flex-shrink-0">
          Page {currentPage} / {activeDoc?.slides.length || 1}
        </span>
      </div>

      {/* Slide Chapter indicator */}
      <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 truncate pl-5 font-medium">
        {currentSlide?.chapter || 'VLearn AI Learning Platform'}
      </p>

      {/* Highlighted text chip */}
      {selectedText && (
        <div className="mt-1 flex items-center justify-between bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg py-1.5 px-2.5 text-xs text-blue-950 dark:text-blue-100 shadow-2xs">
          <div className="flex items-center space-x-1.5 truncate min-w-0">
            <span className="font-bold text-[10px] uppercase text-blue-600 dark:text-blue-400 flex-shrink-0">
              Selected:
            </span>
            <span className="italic truncate font-medium">
              &quot;{selectedText}&quot;
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedText(null)}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2 flex-shrink-0"
            title="Clear selection context"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
