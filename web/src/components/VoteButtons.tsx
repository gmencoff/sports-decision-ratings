'use client';

import { Sentiment } from '@/lib/data/types';

interface VoteButtonsProps {
  onVote: (sentiment: Sentiment) => void;
  disabled?: boolean;
  userVote?: Sentiment | null;
}

export function VoteButtons({
  onVote,
  disabled = false,
  userVote = null,
}: VoteButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVote('good');
        }}
        disabled={disabled}
        className={`
          px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-sm transition-all
          ${
            userVote === 'good'
              ? 'bg-green-600 dark:bg-green-500 text-white'
              : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        Good
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVote('unsure');
        }}
        disabled={disabled}
        className={`
          px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-sm transition-all
          ${
            userVote === 'unsure'
              ? 'bg-gray-600 dark:bg-gray-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        Not sure
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onVote('bad');
        }}
        disabled={disabled}
        className={`
          px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-sm transition-all
          ${
            userVote === 'bad'
              ? 'bg-red-600 dark:bg-red-500 text-white'
              : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        Bad
      </button>
    </div>
  );
}
