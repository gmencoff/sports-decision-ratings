import { VoteCounts } from '@/lib/data/types';

interface SentimentBarProps {
  counts: VoteCounts;
}

export function SentimentBar({ counts }: SentimentBarProps) {
  const total = counts.good + counts.bad + (counts.unsure || 0);

  if (total === 0) {
    return (
      <div className="w-full">
        <div className="h-2 bg-gray-200 rounded-full" />
        <p className="text-xs text-gray-500 mt-1">No votes yet</p>
      </div>
    );
  }

  const goodPercent = Math.round((counts.good / total) * 100);
  const unsurePercent = Math.round(((counts.unsure || 0) / total) * 100);
  const badPercent = 100 - goodPercent - unsurePercent;

  return (
    <div className="w-full">
      <div className="flex h-2 rounded-full overflow-hidden">
        <div
          className="bg-green-500 transition-all duration-300"
          style={{ width: `${goodPercent}%` }}
        />
        <div
          className="bg-gray-400 transition-all duration-300"
          style={{ width: `${unsurePercent}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-300"
          style={{ width: `${badPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{goodPercent}% Good</span>
        <span>{total.toLocaleString()} votes</span>
        <span>{badPercent}% Bad</span>
      </div>
    </div>
  );
}
