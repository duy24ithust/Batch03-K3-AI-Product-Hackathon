'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { CourseDocument } from '../../types';

export const UploadDropzone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const { addDocument } = usePlatformStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const title = file.name.replace(/\.[^/.]+$/, '');
    const newDoc: CourseDocument = {
      id: `doc-${Date.now()}`,
      title: title || 'Uploaded Document',
      filename: file.name,
      pageCount: Math.max(1, Math.floor(file.size / 100000)),
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      dayId: 'day-3', // Default add to Day 3 for immediate visibility
      isFavorite: false,
      slides: [
        {
          pageNumber: 1,
          title: title,
          chapter: 'Uploaded Resource',
          contentMarkdown: `# ${title}\n\nThis document (**${file.name}**) was uploaded directly by the student.\n\n- File Size: ${(file.size / 1024).toFixed(0)} KB\n- Status: Ready for AI Tutor Analysis & Annotation.\n\n*You can highlight text or use the Pen Tool to annotate this slide.*`,
          keyPoints: [
            'Student uploaded custom document.',
            'Ready for context-aware AI explanations.'
          ],
          visualType: 'concept'
        }
      ]
    };

    addDocument('day-3', newDoc);
    setJustUploaded(true);
    setTimeout(() => setJustUploaded(false), 3000);
  };

  return (
    <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
            : justUploaded
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
            : 'border-gray-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-slate-800/80'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.ppt,.pptx"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex items-center space-x-2 text-xs font-medium text-gray-600 dark:text-gray-300">
          {justUploaded ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 animate-bounce" />
              <span className="text-emerald-700 dark:text-emerald-300">Document Uploaded!</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>Drop PDF here or <span className="text-blue-600 dark:text-blue-400 underline">browse</span></span>
            </>
          )}
        </div>
      </label>
    </div>
  );
};
