'use client';

import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';

interface LearningObjectivesListProps {
  objectives: string[];
}

export const LearningObjectivesList: React.FC<LearningObjectivesListProps> = ({ objectives }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
          <Target className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
          3. Learning Objectives
        </h3>
      </div>

      <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
        {objectives.map((obj, i) => (
          <div key={i} className="flex items-center space-x-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{obj}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
