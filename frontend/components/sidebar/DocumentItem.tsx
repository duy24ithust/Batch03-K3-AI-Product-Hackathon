'use client';

import React from 'react';
import { FileText, Star } from 'lucide-react';
import { CourseDocument } from '../../types';
import { usePlatformStore } from '../../store/usePlatformStore';

interface DocumentItemProps {
  document: CourseDocument;
  isSelected: boolean;
}

export const DocumentItem: React.FC<DocumentItemProps> = ({ document, isSelected }) => {
  const { selectDocument, toggleFavorite } = usePlatformStore();

  return (
    <div
      onClick={() => selectDocument(document.id)}
      className={`group relative flex items-center justify-between px-3 py-2.5 my-1 mx-2 rounded-xl cursor-pointer transition-all duration-200 select-none ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium shadow-sm border-l-4 border-blue-600 dark:border-blue-500 pl-2.5'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/70 border-l-4 border-transparent pl-2.5'
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div
          className={`flex-shrink-0 p-1.5 rounded-lg ${
            isSelected
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm truncate font-medium leading-tight">
            {document.title}
          </p>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {document.filename}
            </span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              {document.pageCount} {document.pageCount === 1 ? 'page' : 'pages'}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(document.id);
        }}
        className={`p-1.5 rounded-lg transition-colors ${
          document.isFavorite
            ? 'text-amber-400 hover:text-amber-500 opacity-100'
            : 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 opacity-0 group-hover:opacity-100'
        }`}
        title={document.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
      >
        <Star className={`w-3.5 h-3.5 ${document.isFavorite ? 'fill-amber-400' : ''}`} />
      </button>
    </div>
  );
};
