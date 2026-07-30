'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { ConceptCard } from '../../types';

interface KeyConceptsGridProps {
  concepts: ConceptCard[];
}

export const KeyConceptsGrid: React.FC<KeyConceptsGridProps> = ({ concepts }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
          <Layers className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
          2. Key Concepts
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {concepts.map((item, idx) => (
          <div
            key={idx}
            className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all shadow-2xs hover:shadow-xs group"
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {item.title}
              </h4>
              {item.category && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  {item.category}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
