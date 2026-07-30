'use client';

import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '← / →', description: 'Previous / Next Slide Page' },
    { key: 'M', description: 'Switch to Read Mode' },
    { key: 'P', description: 'Switch to Pen Drawing Tool' },
    { key: 'H', description: 'Switch to Highlight Tool' },
    { key: 'N', description: 'Switch to Sticky Notes Tool' },
    { key: 'F', description: 'Toggle Fullscreen Mode' },
    { key: '0', description: 'Reset Zoom to 100%' },
    { key: 'Ctrl + Z', description: 'Undo Annotation' },
    { key: 'Ctrl + Y', description: 'Redo Annotation' }
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 select-none"
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800/60 last:border-0"
            >
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {item.description}
              </span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-semibold bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-slate-700 shadow-2xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
