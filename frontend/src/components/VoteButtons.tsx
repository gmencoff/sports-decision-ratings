'use client';

interface VoteButtonsProps {
  onVote: (sentiment: 'good' | 'bad') => void;
  disabled?: boolean;
  userVote?: 'good' | 'bad' | null;
}

export function VoteButtons({
  onVote,
  disabled = false,
  userVote = null,
}: VoteButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onVote('good')}
        disabled={disabled}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm transition-all
          ${
            userVote === 'good'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        Good
      </button>
      <button
        onClick={() => onVote('bad')}
        disabled={disabled}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm transition-all
          ${
            userVote === 'bad'
              ? 'bg-red-600 text-white'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        Bad
      </button>
    </div>
  );
}
