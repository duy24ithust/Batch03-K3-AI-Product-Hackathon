'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutGrid,
  Maximize,
  Minimize,
  Download,
  AlertCircle
} from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { ViewerToolbar } from '../toolbar/ViewerToolbar';
import { SlideCanvas } from './SlideCanvas';
import { SlidePage } from '../../types';

export const PdfViewerPanel: React.FC = () => {
  const {
    days,
    selectedDocId,
    currentPage,
    setPage,
    nextPage,
    prevPage,
    pdfSearchQuery,
    setPdfSearchQuery,
    isThumbnailsOpen,
    toggleThumbnails
  } = usePlatformStore();

  const { setTool } = useAnnotationStore();

  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeDocument = days
    .flatMap((d) => d.documents)
    .find((doc) => doc.id === selectedDocId);

  const totalPages = activeDocument?.slides.length || 1;
  const currentSlide: SlidePage = activeDocument?.slides[currentPage - 1] || {
    pageNumber: 1,
    title: 'No slide selected',
    chapter: 'N/A',
    contentMarkdown: 'Please select a document from the sidebar.',
    keyPoints: [],
    visualType: 'concept'
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setZoom(1);

  const toggleFullscreenMode = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    // Trigger download of current slide deck
    const element = document.createElement('a');
    const fileContent = `# ${activeDocument?.title || 'Slide Deck'}\n\n` +
      activeDocument?.slides.map((s) => `## Page ${s.pageNumber}: ${s.title}\n\n${s.contentMarkdown}`).join('\n\n---\n\n') || '';
    const file = new Blob([fileContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeDocument?.filename || 'slide_deck'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Keyboard Navigation Shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevPage();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreenMode();
      } else if (e.key === 'm' || e.key === 'M') {
        setTool('read');
      } else if (e.key === 'p' || e.key === 'P') {
        setTool('pen');
      } else if (e.key === 'h' || e.key === 'H') {
        setTool('highlight');
      } else if (e.key === 'n' || e.key === 'N') {
        setTool('note');
      } else if (e.key === '0') {
        handleResetZoom();
      }
    },
    [nextPage, prevPage, setTool]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const progressPercentage = Math.round((currentPage / totalPages) * 100);

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-100 dark:bg-slate-950 overflow-hidden relative select-none">
      {/* Top Reading Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-slate-900 h-1 relative overflow-hidden">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Toolbar */}
      <ViewerToolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFullscreen={toggleFullscreenMode}
        onDownload={handleDownload}
      />

      {/* Secondary Bar: Thumbnails toggle, document title, in-PDF search */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-800 backdrop-blur-xs text-xs">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleThumbnails}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              isThumbnailsOpen
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Thumbnails</span>
          </button>
          <span className="font-semibold text-gray-800 dark:text-gray-200 hidden md:inline">
            {activeDocument?.title || 'No Document Selected'}
          </span>
          <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">
            • {activeDocument?.filename}
          </span>
        </div>

        {/* Search Inside PDF Input */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search inside PDF..."
            value={pdfSearchQuery}
            onChange={(e) => setPdfSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1 text-xs bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Canvas & Thumbnails Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Thumbnails Drawer */}
        {isThumbnailsOpen && (
          <div className="w-48 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 overflow-y-auto p-3 space-y-3 flex-shrink-0 animate-in slide-in-from-left duration-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Page Thumbnails
            </p>
            {activeDocument?.slides.map((s, idx) => {
              const isSelected = currentPage === s.pageNumber;
              return (
                <div
                  key={s.pageNumber}
                  onClick={() => setPage(s.pageNumber)}
                  className={`group cursor-pointer rounded-xl p-2 border transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-slate-800 hover:border-blue-400 bg-gray-50 dark:bg-slate-800/50'
                  }`}
                >
                  <div className="aspect-[16/10] bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">
                      {s.pageNumber}
                    </span>
                    <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">
                      {s.title}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                    <span>Page {s.pageNumber}</span>
                    {isSelected && (
                      <span className="text-blue-600 dark:text-blue-400 font-bold">Active</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Center Viewer Scroll Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8">
          {activeDocument ? (
            <SlideCanvas
              slide={currentSlide}
              docId={selectedDocId}
              zoom={zoom}
              pdfSearchQuery={pdfSearchQuery}
            />
          ) : (
            <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 max-w-md">
              <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                No Learning Material Selected
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Please pick a PDF slide deck from the course materials sidebar on the left to start reading and interacting with the AI Tutor.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 z-30">
        <button
          type="button"
          onClick={prevPage}
          disabled={currentPage <= 1}
          className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-medium text-xs hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Page</span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-xs font-semibold text-gray-800 dark:text-gray-200">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setPage(val);
              }}
              className="w-12 text-center py-1 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md text-gray-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-400 dark:text-gray-500">/ {totalPages}</span>
          </div>

          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            {progressPercentage}% Read
          </span>
        </div>

        <button
          type="button"
          onClick={nextPage}
          disabled={currentPage >= totalPages}
          className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <span>Next Page</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
};
