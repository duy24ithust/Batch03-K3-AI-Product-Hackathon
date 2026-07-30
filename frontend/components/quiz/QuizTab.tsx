'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Trophy, Sparkles } from 'lucide-react';
import { usePlatformStore } from '../../store/usePlatformStore';
import { aiService } from '../../services/aiService';
import { QuizItem, SummaryScope } from '../../types';
import { MultipleChoiceCard } from './MultipleChoiceCard';
import { TrueFalseCard } from './TrueFalseCard';
import { FillBlankCard } from './FillBlankCard';

export const QuizTab: React.FC = () => {
  const { summaryScope, setSummaryScope, selectedDocId, currentPage } = usePlatformStore();
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const fetchQuiz = async (scope: SummaryScope) => {
    setIsLoading(true);
    setScore(0);
    setAnsweredCount(0);
    try {
      const data = await aiService.getQuizzes(scope);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to generate quiz:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz(summaryScope);
  }, [summaryScope, selectedDocId, currentPage]);

  const handleAnswered = (correct: boolean) => {
    setAnsweredCount((prev) => prev + 1);
    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const scopes: { id: SummaryScope; label: string }[] = [
    { id: 'slide', label: 'Current Slide' },
    { id: 'lesson', label: 'Entire Lesson' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 select-none">
      {/* Top Scope & Scoreboard Bar */}
      <div className="p-3 bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-800 space-y-2.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Quiz Score: {score} / {questions.length}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 block">
                {answeredCount === questions.length && questions.length > 0
                  ? `Completed! (${Math.round((score / questions.length) * 100)}%)`
                  : 'Test your understanding'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchQuiz(summaryScope)}
            disabled={isLoading}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-500 text-gray-700 dark:text-gray-300 transition-colors shadow-2xs"
            title="Generate new quiz questions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>New Quiz</span>
          </button>
        </div>

        {/* Scope Radio Pills */}
        <div className="grid grid-cols-2 gap-1 bg-gray-200/70 dark:bg-slate-800 p-1 rounded-xl">
          {scopes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSummaryScope(s.id)}
              className={`flex items-center justify-center space-x-1.5 py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                summaryScope === s.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Questions List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Generating AI quiz questions for scope: <strong className="uppercase">{summaryScope}</strong>...
            </p>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500 dark:text-gray-400">
            No quiz questions available for this slide.
          </div>
        ) : (
          questions.map((q, idx) => {
            if (q.type === 'multiple_choice') {
              return (
                <MultipleChoiceCard
                  key={q.id}
                  quiz={q}
                  index={idx}
                  onAnswered={handleAnswered}
                />
              );
            }
            if (q.type === 'true_false') {
              return (
                <TrueFalseCard
                  key={q.id}
                  quiz={q}
                  index={idx}
                  onAnswered={handleAnswered}
                />
              );
            }
            return (
              <FillBlankCard
                key={q.id}
                quiz={q}
                index={idx}
                onAnswered={handleAnswered}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
