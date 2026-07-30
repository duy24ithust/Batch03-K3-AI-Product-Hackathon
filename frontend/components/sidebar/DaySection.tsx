'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { LearningDay } from '../../types';
import { DocumentItem } from './DocumentItem';

interface DaySectionProps {
  day: LearningDay;
  selectedDocId: string;
}

export const DaySection: React.FC<DaySectionProps> = ({ day, selectedDocId }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusBadge = (status: LearningDay['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'In Progress':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-gray-100/80 dark:hover:bg-slate-800/60 transition-colors group select-none"
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          )}
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            Day {day.dayNumber}: {day.title}
          </span>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusBadge(
              day.status
            )}`}
          >
            {day.status}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {day.documents.length} {day.documents.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-1 space-y-0.5 pl-2 border-l border-gray-200 dark:border-slate-800 ml-3">
          {day.documents.length === 0 ? (
            <div className="py-3 px-4 text-center text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center space-x-1">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>No materials uploaded</span>
            </div>
          ) : (
            day.documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                document={doc}
                isSelected={doc.id === selectedDocId}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
