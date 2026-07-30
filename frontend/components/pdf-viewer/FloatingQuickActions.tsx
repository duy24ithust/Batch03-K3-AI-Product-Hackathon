'use client';

import React from 'react';
import { Sparkles, MessageSquare, Globe, Lightbulb } from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';

interface FloatingQuickActionsProps {
  selectedText: string | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
}

export const FloatingQuickActions: React.FC<FloatingQuickActionsProps> = ({
  selectedText,
  position,
  onClose
}) => {
  const { setSelectedText, addChatMessage, incrementQuestionsUsed, setActiveAiTab, selectedDocId, currentPage, days } =
    usePlatformStore();

  if (!selectedText || !position) return null;

  const getActiveDocument = () => {
    return days.flatMap((d) => d.documents).find((doc) => doc.id === selectedDocId);
  };

  const handleAction = (type: 'explain' | 'summarize' | 'translate' | 'example') => {
    const doc = getActiveDocument();
    const docTitle = doc?.title || 'Course Material';

    setSelectedText(selectedText);
    setActiveAiTab('chat');
    incrementQuestionsUsed();

    let promptText = '';
    let responseText = '';

    switch (type) {
      case 'explain':
        promptText = `Explain this highlighted text: "${selectedText}"`;
        responseText = `### 💡 Detailed Explanation\n\n> *"${selectedText}"*\n\nThis passage from **${docTitle}** emphasizes how Agentic AI systems autonomously plan and invoke tools to achieve goals. In production systems, this requires clear JSON schemas and continuous observation loops to prevent hallucination.`;
        break;
      case 'summarize':
        promptText = `Summarize this text concisely: "${selectedText}"`;
        responseText = `### 📝 Key Summary\n\n- **Core idea**: "${selectedText}"\n- **Takeaway**: Autonomous agents replace single-prompt responses with multi-step reasoning cycles.`;
        break;
      case 'translate':
        promptText = `Translate this text into Vietnamese: "${selectedText}"`;
        responseText = `### 🇻🇳 Bản Dịch & Giải Thích\n\n> *"${selectedText}"*\n\n**Dịch sang Tiếng Việt:** *"Đây là nội dung giải thích cơ chế hoạt động của Trợ lý AI tự chủ và cách gọi công cụ trong hệ thống."*\n\n**Từ khoá cần nhớ:** Autonomous Agent, Tool Calling, Reasoning Loop.`;
        break;
      case 'example':
        promptText = `Give a real-world enterprise example for: "${selectedText}"`;
        responseText = `### 🚀 Real-World Enterprise Example\n\nIn a cloud infrastructure automated remediation agent, when a CPU spike occurs (*"${selectedText}"*), the agent automatically diagnoses the logs, calls the scale-up API, and verifies the metrics before closing the ticket.`;
        break;
    }

    // Add user prompt
    addChatMessage({
      sender: 'user',
      text: promptText
    });

    // Add AI tutor simulated response
    setTimeout(() => {
      addChatMessage({
        sender: 'ai',
        text: responseText,
        citation: { pageNumber: currentPage, title: docTitle }
      });
    }, 600);

    onClose();
  };

  return (
    <div
      style={{ left: position.x, top: position.y - 48 }}
      className="absolute z-50 flex items-center space-x-1 p-1 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150"
    >
      <button
        type="button"
        onClick={() => handleAction('explain')}
        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-xs font-medium transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>Explain</span>
      </button>

      <div className="w-px h-4 bg-slate-700" />

      <button
        type="button"
        onClick={() => handleAction('summarize')}
        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-xs font-medium transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
        <span>Summarize</span>
      </button>

      <div className="w-px h-4 bg-slate-700" />

      <button
        type="button"
        onClick={() => handleAction('translate')}
        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-xs font-medium transition-colors"
      >
        <Globe className="w-3.5 h-3.5 text-amber-400" />
        <span>Translate</span>
      </button>

      <div className="w-px h-4 bg-slate-700" />

      <button
        type="button"
        onClick={() => handleAction('example')}
        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-xs font-medium transition-colors"
      >
        <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
        <span>Example</span>
      </button>
    </div>
  );
};
