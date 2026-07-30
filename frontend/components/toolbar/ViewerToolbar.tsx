'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  PenTool,
  Highlighter,
  StickyNote,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize,
  Undo,
  Redo,
  RotateCcw,
  Palette
} from 'lucide-react';
import { useAnnotationStore } from '../../store/useAnnotationStore';
import { ViewerTool } from '../../types';

interface ViewerToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFullscreen: () => void;
  onDownload: () => void;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFullscreen,
  onDownload
}) => {
  const {
    activeTool,
    setTool,
    activeColor,
    setColor,
    undo,
    redo,
    undoStack,
    redoStack
  } = useAnnotationStore();

  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    { name: 'Blue', value: '#2563EB' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#FACC15' },
    { name: 'Purple', value: '#8B5CF6' }
  ];

  const tools: { id: ViewerTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'read', label: 'Read Mode', icon: <BookOpen className="w-4 h-4" />, shortcut: 'M' },
    { id: 'pen', label: 'Pen Tool', icon: <PenTool className="w-4 h-4" />, shortcut: 'P' },
    { id: 'highlight', label: 'Highlight Tool', icon: <Highlighter className="w-4 h-4" />, shortcut: 'H' },
    { id: 'note', label: 'Notes', icon: <StickyNote className="w-4 h-4" />, shortcut: 'N' }
  ];

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-xs select-none">
      {/* Left: Reading / Annotation Tools */}
      <div className="flex items-center space-x-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setTool(tool.id)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTool === tool.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
            <span className="hidden sm:inline">{tool.label}</span>
          </button>
        ))}

        {/* Color picker toggle for Pen / Highlight */}
        {(activeTool === 'pen' || activeTool === 'highlight') && (
          <div className="relative ml-2">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
              title="Select Color"
            >
              <Palette className="w-3.5 h-3.5" />
              <div
                className="w-3.5 h-3.5 rounded-full border border-white dark:border-slate-600 shadow-xs"
                style={{ backgroundColor: activeColor }}
              />
            </button>

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 flex space-x-1 z-30">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setColor(c.value);
                      setShowColorPicker(false);
                    }}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      activeColor === c.value ? 'scale-110 ring-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle: Undo / Redo */}
      <div className="hidden md:flex items-center space-x-1 border-x border-gray-200 dark:border-slate-800 px-3">
        <button
          type="button"
          onClick={undo}
          disabled={undoStack.length === 0}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={redoStack.length === 0}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Zoom / Download / Fullscreen */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={onZoomOut}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onResetZoom}
          className="px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-w-[3.5rem] text-center"
          title="Reset Zoom (0)"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={onDownload}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Download Slide Deck PDF"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onFullscreen}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Toggle Fullscreen (F)"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
