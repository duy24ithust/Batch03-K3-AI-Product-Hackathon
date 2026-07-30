'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { QuizItem } from '../../types';

interface FillBlankCardProps {
  quiz: QuizItem;
  index: number;
  onAnswered: (correct: boolean) => void;
}

export const FillBlankCard: React.FC<FillBlankCardProps> = ({
  quiz,
  index,
  onAnswered
}) => {
  const [answer, setAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !answer.trim()) return;
    const correct = answer.trim().toLowerCase() === quiz.correctAnswer.toLowerCase();
    setIsCorrect(correct);
    setIsAnswered(true);
    onAnswered(correct);
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
          Question {index + 1} • Fill in the Blank
        </span>
        {quiz.slideRef && (
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
            Ref: Slide {quiz.slideRef}
          </span>
        )}
      </div>

      <p
        className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100"
        dangerouslySetInnerHTML={{
          __html: quiz.question.replace('______', '<span class="underline decoration-blue-500 font-bold">______</span>')
        }}
      />

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="text"
          disabled={isAnswered}
          placeholder="Type your answer here..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className={`flex-1 px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 ${
            isAnswered
              ? isCorrect
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold'
                : 'border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-900 dark:text-red-200'
              : 'border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-blue-500'
          }`}
        />
        {!isAnswered && (
          <button
            type="submit"
            disabled={!answer.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center space-x-1"
          >
            <span>Submit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {isAnswered && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">
                  Correct! The answer is <strong>{quiz.correctAnswer}</strong>.
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600 dark:text-red-300">
                  Incorrect. The correct answer is <strong>{quiz.correctAnswer}</strong>.
                </span>
              </>
            )}
          </div>

          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50 space-y-1">
            <div className="flex items-center space-x-1 text-xs font-bold text-blue-800 dark:text-blue-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Explanation</span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              {quiz.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
