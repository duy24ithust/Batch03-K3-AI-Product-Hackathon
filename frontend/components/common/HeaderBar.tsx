'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  PanelLeft,
  PanelRight,
  Keyboard,
  Moon,
  Sun,
  BookMarked
} from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';

interface HeaderBarProps {
  onOpenShortcutsModal: () => void;
  onOpenNotesDrawer: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenShortcutsModal,
  onOpenNotesDrawer
}) => {
  const {
    isSidebarOpen,
    toggleSidebar,
    isAiPanelOpen,
    toggleAiPanel,
    days,
    selectedDocId
  } = usePlatformStore();

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const activeDoc = days
    .flatMap((d) => d.documents)
    .find((doc) => doc.id === selectedDocId);

  return (
    <header className="h-12 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 flex items-center justify-between select-none z-30 shadow-2xs">
      {/* Left section: Drawer Toggle & Brand Logo & Breadcrumb */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className={`p-1.5 rounded-lg transition-colors ${
            isSidebarOpen
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Left Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-gray-900 dark:text-white hidden sm:inline">
            VLearn<span className="text-blue-600 dark:text-blue-400">.ai</span>
          </span>
        </div>

        <span className="text-gray-300 dark:text-slate-700 hidden md:inline">/</span>

        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate hidden md:inline max-w-xs">
          {activeDoc?.title || 'Agentic AI Bootcamp'}
        </span>
      </div>

      {/* Right section: Actions & AI Drawer Toggle */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        <button
          type="button"
          onClick={onOpenNotesDrawer}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="View All My Notes & Bookmarks"
        >
          <BookMarked className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">My Notes</span>
        </button>

        <button
          type="button"
          onClick={onOpenShortcutsModal}
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={toggleAiPanel}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            isAiPanelOpen
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
          }`}
          title="Toggle AI Tutor Panel"
        >
          <PanelRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Tutor</span>
        </button>
      </div>
    </header>
  );
};
