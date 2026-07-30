'use client';

import React, { useState } from 'react';
import { BookMarked, Download, Trash2, X, StickyNote, Bookmark } from 'lucide-react';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { usePlatformStore } from '../../store/usePlatformStore';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose }) => {
  const { annotations, bookmarks, removeAnnotation, toggleBookmark } = useAnnotationStore();
  const { days, setPage, selectDocument } = usePlatformStore();

  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks'>('notes');

  if (!isOpen) return null;

  const allStickyNotes = annotations.filter((a) => a.type === 'sticky_note');

  const getDocTitle = (docId: string) => {
    const found = days.flatMap((d) => d.documents).find((doc) => doc.id === docId);
    return found?.title || 'Unknown Document';
  };

  const handleJumpToSlide = (docId: string, pageNumber: number) => {
    selectDocument(docId);
    setPage(pageNumber);
    onClose();
  };

  const handleExportMarkdown = () => {
    let md = `# My VLearn Notebook & Annotations\n\nGenerated on ${new Date().toLocaleDateString()}\n\n`;

    md += `## 📝 Sticky Notes (${allStickyNotes.length})\n\n`;
    if (allStickyNotes.length === 0) {
      md += `*No sticky notes recorded yet.*\n\n`;
    } else {
      allStickyNotes.forEach((n, idx) => {
        md += `### Note ${idx + 1} (${getDocTitle(n.docId)} - Slide ${n.pageNumber})\n\n`;
        md += `> ${n.noteText || ''}\n\n`;
      });
    }

    md += `## 🔖 Bookmarked Slides (${bookmarks.length})\n\n`;
    if (bookmarks.length === 0) {
      md += `*No bookmarks recorded yet.*\n\n`;
    } else {
      bookmarks.forEach((b, idx) => {
        md += `- **Slide ${b.pageNumber}** in *${getDocTitle(b.docId)}*\n`;
      });
    }

    const element = document.createElement('a');
    const file = new Blob([md], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `vlearn_my_notebook.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4 select-none max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
              <BookMarked className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              My Student Notebook
            </h3>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              title="Export Notebook as Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'notes'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Sticky Notes ({allStickyNotes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookmarks')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarks ({bookmarks.length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
          {activeTab === 'notes' ? (
            allStickyNotes.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 dark:text-gray-500">
                You haven&apos;t created any sticky notes yet. Click on &quot;Notes (N)&quot; in the Viewer toolbar to add notes to any slide!
              </div>
            ) : (
              allStickyNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleJumpToSlide(note.docId, note.pageNumber)}
                  className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-start justify-between cursor-pointer hover:border-amber-400 transition-colors group"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-2">
                    <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      <span>{getDocTitle(note.docId)}</span>
                      <span>•</span>
                      <span>Slide {note.pageNumber}</span>
                    </div>
                    <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                      {note.noteText}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAnnotation(note.id);
                    }}
                    className="p-1 rounded text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )
          ) : bookmarks.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 dark:text-gray-500">
              You haven&apos;t bookmarked any slides yet. Click the bookmark icon on the top right of any slide!
            </div>
          ) : (
            bookmarks.map((bm, idx) => (
              <div
                key={idx}
                onClick={() => handleJumpToSlide(bm.docId, bm.pageNumber)}
                className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-600 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {getDocTitle(bm.docId)}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Slide {bm.pageNumber}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(bm.docId, bm.pageNumber);
                  }}
                  className="p-1 rounded text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove Bookmark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
