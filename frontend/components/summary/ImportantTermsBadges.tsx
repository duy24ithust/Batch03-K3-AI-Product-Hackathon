'use client';

import React from 'react';
import { Tag } from 'lucide-react';

interface ImportantTermsBadgesProps {
  terms: string[];
}

export const ImportantTermsBadges: React.FC<ImportantTermsBadgesProps> = ({ terms }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 rounded-lg bg-amber-600 text-white shadow-xs">
          <Tag className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
          4. Important Terms
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {terms.map((term, i) => (
          <span
            key={i}
            className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80 shadow-2xs hover:scale-105 transition-transform select-none cursor-default"
          >
            #{term}
          </span>
        ))}
      </div>
    </div>
  );
};
