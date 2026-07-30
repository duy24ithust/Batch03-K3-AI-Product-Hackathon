'use client';

import React, { useState } from 'react';
import { SlidePage } from '../../types';
import { AnnotationLayer } from './AnnotationLayer';
import { StickyNotesOverlay } from './StickyNotesOverlay';
import { FloatingQuickActions } from './FloatingQuickActions';
import { Bookmark as BookmarkIcon, Copy, Share2, Eye } from 'lucide-react';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { usePlatformStore } from '../../store/usePlatformStore';

interface CanvasProps {
  slide: SlidePage;
  docId: string;
  zoom: number;
  pdfSearchQuery: string;
}

export const SlideCanvas: React.FC<CanvasProps> = ({
  slide,
  docId,
  zoom,
  pdfSearchQuery
}) => {
  const { toggleBookmark, bookmarks } = useAnnotationStore();
  const { setSelectedText } = usePlatformStore();

  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedTextString, setSelectedTextString] = useState<string | null>(null);

  const isBookmarked = bookmarks.some(
    (b) => b.docId === docId && b.pageNumber === slide.pageNumber
  );

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 2 && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const container = document.getElementById('slide-canvas-container')?.getBoundingClientRect();
      if (container) {
        setPopoverPos({
          x: rect.left - container.left + rect.width / 2 - 80,
          y: rect.top - container.top
        });
        setSelectedTextString(text);
        setSelectedText(text);
      }
    } else {
      setPopoverPos(null);
      setSelectedTextString(null);
    }
  };

  const highlightSearchKeywords = (text: string) => {
    if (!pdfSearchQuery.trim()) return text;
    const regex = new RegExp(`(${pdfSearchQuery})`, 'gi');
    return text.replace(regex, `<mark class="bg-yellow-300 dark:bg-yellow-600 px-1 rounded">$1</mark>`);
  };

  return (
    <div
      id="slide-canvas-container"
      onMouseUp={handleMouseUp}
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
      className="relative w-full max-w-4xl aspect-[16/10] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-8 md:p-12 flex flex-col justify-between overflow-hidden transition-all duration-300 select-text"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 z-30">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {slide.chapter}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Slide {slide.pageNumber}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => toggleBookmark(docId, slide.pageNumber)}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
            title={isBookmarked ? 'Bookmarked' : 'Bookmark this slide'}
          >
            <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-6 space-y-6 z-30 overflow-y-auto max-h-[70%]">
        <h1
          className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-snug"
          dangerouslySetInnerHTML={{ __html: highlightSearchKeywords(slide.title) }}
        />

        {/* Formatted Content Blocks */}
        <div className="prose dark:prose-invert max-w-none space-y-4 text-sm md:text-base leading-relaxed text-gray-700 dark:text-gray-300">
          {slide.contentMarkdown.split('\n\n').map((block, idx) => {
            if (block.startsWith('# ')) return null; // already rendered title
            if (block.startsWith('```text') || block.startsWith('```json') || block.startsWith('```')) {
              const codeClean = block.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
              return (
                <pre
                  key={idx}
                  className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner"
                >
                  <code>{codeClean}</code>
                </pre>
              );
            }
            if (block.startsWith('> ')) {
              return (
                <blockquote
                  key={idx}
                  className="p-4 border-l-4 border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 rounded-r-xl italic text-gray-800 dark:text-gray-200"
                >
                  {block.replace('> ', '')}
                </blockquote>
              );
            }
            return (
              <p
                key={idx}
                dangerouslySetInnerHTML={{
                  __html: highlightSearchKeywords(
                    block
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                  )
                }}
              />
            );
          })}
        </div>

        {/* Key Points Checklist */}
        {slide.keyPoints && slide.keyPoints.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Slide Key Points
            </h4>
            <ul className="space-y-1.5">
              {slide.keyPoints.map((kp, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-gray-700 dark:text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <span>{kp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer / Copyright row */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800 text-[10px] text-gray-400 dark:text-gray-500 z-30">
        <span>VLearn AI Learning Platform • Advanced Agentic Coding</span>
        <span>Page {slide.pageNumber}</span>
      </div>

      {/* Annotation and Note Overlays */}
      <AnnotationLayer docId={docId} pageNumber={slide.pageNumber} />
      <StickyNotesOverlay docId={docId} pageNumber={slide.pageNumber} />

      {/* Floating AI Quick Actions for Selected Text */}
      <FloatingQuickActions
        selectedText={selectedTextString}
        position={popoverPos}
        onClose={() => setPopoverPos(null)}
      />
    </div>
  );
};
