import { VoteCounts } from '@/lib/data/types';

interface SentimentBarProps {
  counts: VoteCounts;
}

export function SentimentBar({ counts }: SentimentBarProps) {
  const total = counts.good + counts.bad + (counts.unsure || 0);

  if (total === 0) {
    return (
      <div className="w-full">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <p className="text-xs text-text-muted mt-1">No votes yet</p>
      </div>
    );
  }

  const goodPercent = Math.round((counts.good / total) * 100);
  const unsurePercent = Math.round(((counts.unsure || 0) / total) * 100);
  const badPercent = 100 - goodPercent - unsurePercent;

  return (
    <div className="w-full">
      <div className="flex h-8 rounded-full overflow-hidden text-sm font-bold text-white">
        <div
          className="bg-green-500 transition-all duration-300 flex items-center justify-center"
          style={{ width: `${goodPercent}%` }}
        >
          {goodPercent >= 15 && `${goodPercent}%`}
        </div>
        <div
          className="bg-gray-400 transition-all duration-300 flex items-center justify-center"
          style={{ width: `${unsurePercent}%` }}
        >
          {unsurePercent >= 15 && `${unsurePercent}%`}
        </div>
        <div
          className="bg-red-500 transition-all duration-300 flex items-center justify-center"
          style={{ width: `${badPercent}%` }}
        >
          {badPercent >= 15 && `${badPercent}%`}
        </div>
      </div>
      <div className="text-xs text-text-muted text-center mt-1">
        {total.toLocaleString()} votes
      </div>
    </div>
  );
}
