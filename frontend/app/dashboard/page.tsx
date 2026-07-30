'use client';

import React, { useState } from 'react';
import { HeaderBar } from '../../components/common/HeaderBar';
import { CourseSidebar } from '../../components/sidebar/CourseSidebar';
import { PdfViewerPanel } from '../../components/pdf-viewer/PdfViewerPanel';
import { AiTutorPanel } from '../../components/ai-panel/AiTutorPanel';
import { KeyboardShortcutsModal } from '../../components/common/KeyboardShortcutsModal';
import { NoteModal } from '../../components/notes/NoteModal';
import { ToastContainer, ToastMessage } from '../../components/common/ToastContainer';

export default function DashboardPage() {
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([
    {
      id: 'welcome',
      title: 'Welcome to VLearn AI Platform',
      description: 'Drag & drop a slide deck or select from the left sidebar to start studying!'
    }
  ]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-slate-950 font-sans">
      {/* Top Header Bar */}
      <HeaderBar
        onOpenShortcutsModal={() => setShowShortcutsModal(true)}
        onOpenNotesDrawer={() => setShowNotesModal(true)}
      />

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Course Materials */}
        <CourseSidebar />

        {/* Center Column: PDF / Slide Deck Viewer & Tools */}
        <PdfViewerPanel />

        {/* Right Column: AI Tutor Panel (Chat, Summary, Quiz) */}
        <AiTutorPanel />
      </div>

      {/* Modals & Overlays */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <NoteModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
