'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles, Key, Bot, User, Bookmark } from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { PROMPT_SUGGESTIONS } from '../../data/mockCourseData';
import { aiService } from '../../services/aiService';
import { ContextBadge } from './ContextBadge';

export const ChatTab: React.FC = () => {
  const {
    days,
    selectedDocId,
    currentPage,
    selectedText,
    chatMessages,
    addChatMessage,
    incrementQuestionsUsed
  } = usePlatformStore();

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vlearn_api_key') || '';
      setApiKey(stored);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isThinking]);

  const activeDoc = days
    .flatMap((d) => d.documents)
    .find((doc) => doc.id === selectedDocId);

  const currentSlide = activeDoc?.slides[currentPage - 1];

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim()) return;

    if (!customPrompt) {
      setInput('');
    }

    // Add user message
    addChatMessage({
      sender: 'user',
      text: promptToSend,
      selectedContext: selectedText
        ? {
            docTitle: activeDoc?.title || '',
            pageNumber: currentPage,
            chapter: currentSlide?.chapter || '',
            highlightedText: selectedText
          }
        : undefined
    });

    incrementQuestionsUsed();
    setIsThinking(true);

    try {
      const result = await aiService.askTutor({
        prompt: promptToSend,
        docTitle: activeDoc?.title || 'Generative AI Systems',
        pageNumber: currentPage,
        chapter: currentSlide?.chapter || 'Chapter 1',
        selectedText: selectedText || undefined,
        apiKey: apiKey || undefined
      });

      addChatMessage({
        sender: 'ai',
        text: result.text,
        citation: result.citation
      });
    } catch (err) {
      addChatMessage({
        sender: 'ai',
        text: `### ⚠️ Tutor Notice\n\nI encountered an error processing your query. Please check your internet connection or try again.`
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vlearn_api_key', apiKey.trim());
      setKeySaved(true);
      setTimeout(() => {
        setKeySaved(false);
        setShowApiKeyModal(false);
      }, 1200);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 relative">
      {/* Context Badge at top */}
      <ContextBadge />

      {/* Example Prompt Chips */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-slate-900/60 border-b border-gray-100 dark:border-slate-800 flex items-center space-x-1.5 overflow-x-auto custom-scrollbar flex-shrink-0 select-none">
        {PROMPT_SUGGESTIONS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => handleSend(chip.prompt)}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-full flex-shrink-0 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
                msg.sender === 'ai'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {msg.sender === 'ai' ? (
                <Bot className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>

            <div
              className={`max-w-[82%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-gray-100 dark:bg-slate-800/90 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/60 dark:border-slate-700/60'
              }`}
            >
              {/* Selected Context indicator in user bubble */}
              {msg.selectedContext?.highlightedText && (
                <div className="mb-2 p-2 rounded-lg bg-black/10 dark:bg-black/20 text-xs italic border-l-2 border-white/60">
                  &quot;{msg.selectedContext.highlightedText}&quot;
                </div>
              )}

              {/* Formatted Markdown Content */}
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm">
                {msg.text.split('\n\n').map((para, i) => {
                  if (para.startsWith('### ')) {
                    return (
                      <h4 key={i} className="font-bold text-sm mb-1">
                        {para.replace('### ', '')}
                      </h4>
                    );
                  }
                  if (para.startsWith('> ')) {
                    return (
                      <blockquote key={i} className="pl-3 border-l-2 border-blue-400 italic my-1">
                        {para.replace('> ', '')}
                      </blockquote>
                    );
                  }
                  return (
                    <p
                      key={i}
                      className="mb-1"
                      dangerouslySetInnerHTML={{
                        __html: para
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      }}
                    />
                  );
                })}
              </div>

              {/* Citation badge if available */}
              {msg.citation && (
                <div className="mt-2.5 pt-2 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1 font-medium">
                    <Bookmark className="w-3 h-3 text-blue-500" />
                    <span>Citation: Slide {msg.citation.pageNumber}</span>
                  </span>
                  <span>{msg.citation.title}</span>
                </div>
              )}

              {/* Timestamp */}
              <p
                className={`text-[10px] mt-1.5 text-right ${
                  msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}

        {/* AI Typing Indicator */}
        {isThinking && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-3.5 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <span
                className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                Analyzing slide context...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-slate-800/80 rounded-xl px-3 py-1.5 border border-gray-200 dark:border-slate-700 focus-within:border-blue-500 transition-colors">
          <input
            type="text"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />

          <button
            type="button"
            onClick={() => setShowApiKeyModal(true)}
            className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg transition-colors"
            title="Configure LLM API Key (OpenAI / OpenRouter)"
          >
            <Key className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setInput('Explain this slide simply with real examples.');
            }}
            className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg transition-colors"
            title="Voice input (demo)"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pluggable API Key Modal */}
      {showApiKeyModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Pluggable LLM API Key
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              By default, the platform runs in an intelligent simulation mode out-of-the-box. You can plug your OpenAI (`sk-...`) or OpenRouter key below for live API calls anytime!
            </p>

            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {keySaved ? 'Saved! ✓' : 'Save Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
