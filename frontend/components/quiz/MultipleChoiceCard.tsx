'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { QuizItem } from '../../types';

interface MultipleChoiceCardProps {
  quiz: QuizItem;
  index: number;
  onAnswered: (correct: boolean) => void;
}

export const MultipleChoiceCard: React.FC<MultipleChoiceCardProps> = ({
  quiz,
  index,
  onAnswered
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    const isCorrect = option === quiz.correctAnswer;
    onAnswered(isCorrect);
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
          Question {index + 1} • Multiple Choice
        </span>
        {quiz.slideRef && (
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
            Ref: Slide {quiz.slideRef}
          </span>
        )}
      </div>

      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
        {quiz.question}
      </p>

      <div className="space-y-2">
        {quiz.options?.map((option, idx) => {
          const isCorrect = option === quiz.correctAnswer;
          const isSelected = selectedOption === option;

          let btnClass =
            'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/60 text-gray-800 dark:text-gray-200';

          if (isAnswered) {
            if (isCorrect) {
              btnClass =
                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
            } else if (isSelected && !isCorrect) {
              btnClass =
                'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
            } else {
              btnClass =
                'border-gray-100 dark:border-slate-800 opacity-60 text-gray-500 dark:text-gray-400';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelect(option)}
              className={`w-full text-left p-2.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${btnClass}`}
            >
              <span>{option}</span>
              {isAnswered && isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              )}
              {isAnswered && isSelected && !isCorrect && (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50 space-y-1 animate-in fade-in duration-200">
          <div className="flex items-center space-x-1 text-xs font-bold text-blue-800 dark:text-blue-300">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Explanation</span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            {quiz.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
