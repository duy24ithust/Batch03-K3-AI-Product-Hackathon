'use client';

import React, { useMemo } from 'react';
import { Search, BookOpen, PanelLeftClose, Star, Clock, Filter } from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { DaySection } from './DaySection';
import { UploadDropzone } from './UploadDropzone';

export const CourseSidebar: React.FC = () => {
  const {
    days,
    selectedDocId,
    searchQuery,
    setSearchQuery,
    isSidebarOpen,
    toggleSidebar,
    sidebarWidth,
    filterTab,
    setFilterTab
  } = usePlatformStore();

  const filteredDays = useMemo(() => {
    return days
      .map((day) => {
        let docs = day.documents;

        if (filterTab === 'favorites') {
          docs = docs.filter((d) => d.isFavorite);
        } else if (filterTab === 'recent') {
          // Simply show favorites + selected as recent for demo
          docs = docs.filter((d) => d.isFavorite || d.id === selectedDocId);
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          docs = docs.filter(
            (d) =>
              d.title.toLowerCase().includes(q) ||
              d.filename.toLowerCase().includes(q)
          );
        }

        return { ...day, documents: docs };
      })
      .filter((day) => day.documents.length > 0 || !searchQuery.trim());
  }, [days, filterTab, searchQuery, selectedDocId]);

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <aside
      style={{ width: sidebarWidth }}
      className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-200 select-none flex-shrink-0 relative shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              Course Materials
            </h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              VLearn AI Curriculum
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between px-3 pb-2 border-b border-gray-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
            filterTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('recent')}
          className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors mx-1 flex items-center justify-center space-x-1 ${
            filterTab === 'recent'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3 h-3 inline mr-1" />
          Recent
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('favorites')}
          className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors flex items-center justify-center space-x-1 ${
            filterTab === 'favorites'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className="w-3 h-3 inline mr-1" />
          Favs
        </button>
      </div>

      {/* Learning Days Accordion List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {filteredDays.length === 0 ? (
          <div className="py-8 text-center">
            <Filter className="w-6 h-6 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No matching documents found
            </p>
          </div>
        ) : (
          filteredDays.map((day) => (
            <DaySection key={day.id} day={day} selectedDocId={selectedDocId} />
          ))
        )}
      </div>

      {/* Dropzone for PDF Upload */}
      <UploadDropzone />
    </aside>
  );
};
