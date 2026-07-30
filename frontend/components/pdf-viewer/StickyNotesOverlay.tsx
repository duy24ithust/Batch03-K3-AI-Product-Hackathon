'use client';

import React, { useState } from 'react';
import { StickyNote, X, Edit2, Check } from 'lucide-react';
import { useAnnotationStore } from '../../store/useAnnotationStore';

interface StickyNotesOverlayProps {
  docId: string;
  pageNumber: number;
}

export const StickyNotesOverlay: React.FC<StickyNotesOverlayProps> = ({ docId, pageNumber }) => {
  const { annotations, activeTool, addAnnotation, removeAnnotation, updateNoteText } =
    useAnnotationStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const stickyNotes = annotations.filter(
    (a) => a.docId === docId && a.pageNumber === pageNumber && a.type === 'sticky_note'
  );

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'note') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addAnnotation({
      docId,
      pageNumber,
      type: 'sticky_note',
      noteText: 'New note: Click to edit text...',
      position: { x: Math.min(x, rect.width - 220), y: Math.min(y, rect.height - 120) }
    });
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = (id: string) => {
    updateNoteText(id, editText);
    setEditingId(null);
  };

  return (
    <div
      onClick={handleCanvasClick}
      className={`absolute inset-0 w-full h-full z-20 ${
        activeTool === 'note' ? 'cursor-copy pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {stickyNotes.map((note) => {
        const posX = note.position?.x || 50;
        const posY = note.position?.y || 50;

        return (
          <div
            key={note.id}
            onClick={(e) => e.stopPropagation()}
            style={{ left: posX, top: posY }}
            className="absolute w-56 bg-amber-100 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-800 rounded-xl shadow-md p-3 text-amber-950 dark:text-amber-100 pointer-events-auto transition-transform hover:scale-105 select-none"
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-200 dark:border-amber-900/60">
              <div className="flex items-center space-x-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <StickyNote className="w-3.5 h-3.5" />
                <span>Sticky Note</span>
              </div>
              <div className="flex items-center space-x-1">
                {editingId === note.id ? (
                  <button
                    type="button"
                    onClick={() => saveEdit(note.id)}
                    className="p-1 rounded text-emerald-700 dark:text-emerald-400 hover:bg-amber-200 dark:hover:bg-amber-900"
                    title="Save Note"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(note.id, note.noteText || '')}
                    className="p-1 rounded text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900"
                    title="Edit Note"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAnnotation(note.id)}
                  className="p-1 rounded text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900"
                  title="Delete Note"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {editingId === note.id ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit(note.id);
                  }
                }}
                className="w-full h-20 text-xs bg-amber-50 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded p-1.5 text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                autoFocus
              />
            ) : (
              <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">
                {note.noteText}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
