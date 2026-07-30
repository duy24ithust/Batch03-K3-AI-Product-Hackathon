'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

interface KeyTakeawaysBoxProps {
  takeaway: string;
}

export const KeyTakeawaysBox: React.FC<KeyTakeawaysBoxProps> = ({ takeaway }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 rounded-lg bg-yellow-500 text-white shadow-xs">
          <Lightbulb className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-900 dark:text-yellow-300">
          5. Key Takeaways
        </h3>
      </div>

      <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20 rounded-xl border-l-4 border-yellow-500 shadow-sm">
        <p className="text-xs font-bold text-yellow-900 dark:text-yellow-200 mb-1">
          What you should remember after completing this lesson:
        </p>
        <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed italic">
          &quot;{takeaway}&quot;
        </p>
      </div>
    </div>
  );
};
