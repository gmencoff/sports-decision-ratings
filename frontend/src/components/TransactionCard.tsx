'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Transaction, VoteCounts, Sentiment } from '@/lib/data/types';
import { getDataProvider } from '@/lib/data';
import { getUserId } from '@/lib/userId';
import { VoteButtons } from './VoteButtons';
import { SentimentBar } from './SentimentBar';

interface TransactionCardProps {
  transaction: Transaction;
  showLink?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  trade: 'Trade',
  signing: 'Signing',
  draft: 'Draft',
  release: 'Release',
  extension: 'Extension',
  hire: 'Hire',
  fire: 'Fire',
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

interface TeamVoteState {
  counts: VoteCounts;
  userVote: Sentiment | null;
  isVoting: boolean;
}

export function TransactionCard({
  transaction,
  showLink = true,
}: TransactionCardProps) {
  const [teamVotes, setTeamVotes] = useState<Record<string, TeamVoteState>>({});

  useEffect(() => {
    async function loadVoteCounts() {
      const provider = await getDataProvider();
      const userId = getUserId();
      const newTeamVotes: Record<string, TeamVoteState> = {};

      for (const team of transaction.teams) {
        const [counts, userVote] = await Promise.all([
          provider.getVoteCounts(transaction.id, team.id),
          provider.getUserVote(transaction.id, team.id, userId),
        ]);
        newTeamVotes[team.id] = {
          counts,
          userVote,
          isVoting: false,
        };
      }

      setTeamVotes(newTeamVotes);
    }

    loadVoteCounts();
  }, [transaction.id, transaction.teams]);

  async function handleVote(teamId: string, sentiment: Sentiment) {
    const currentState = teamVotes[teamId];
    if (!currentState || currentState.isVoting) {
      return;
    }

    // Don't re-submit the same vote
    if (currentState.userVote === sentiment) {
      return;
    }

    setTeamVotes((prev) => ({
      ...prev,
      [teamId]: { ...prev[teamId], isVoting: true },
    }));

    try {
      const provider = await getDataProvider();
      const userId = getUserId();
      await provider.submitVote({
        transactionId: transaction.id,
        teamId,
        userId,
        sentiment,
      });

      const newCounts = await provider.getVoteCounts(transaction.id, teamId);

      setTeamVotes((prev) => ({
        ...prev,
        [teamId]: {
          counts: newCounts,
          userVote: sentiment,
          isVoting: false,
        },
      }));
    } catch (error) {
      console.error('Failed to submit vote:', error);
      setTeamVotes((prev) => ({
        ...prev,
        [teamId]: { ...prev[teamId], isVoting: false },
      }));
    }
  }

  const cardContent = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
          {TYPE_LABELS[transaction.type] || transaction.type}
        </span>
        <span className="text-sm text-gray-500">
          {formatTimestamp(transaction.timestamp)}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {transaction.title}
      </h3>

      <p className="text-gray-600 text-sm mb-4">{transaction.description}</p>

      <div className="space-y-4">
        {transaction.teams.map((team) => {
          const voteState = teamVotes[team.id] || {
            counts: { good: 0, bad: 0, unsure: 0 },
            userVote: null,
            isVoting: false,
          };

          return (
            <div
              key={team.id}
              className="pt-4 border-t border-gray-100 first:pt-0 first:border-t-0"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-800">{team.name}</span>
                <VoteButtons
                  onVote={(sentiment) => handleVote(team.id, sentiment)}
                  disabled={voteState.isVoting}
                  userVote={voteState.userVote}
                />
              </div>
              <SentimentBar counts={voteState.counts} />
            </div>
          );
        })}
      </div>
    </div>
  );

  if (showLink) {
    return (
      <Link
        href={`/transactions/${transaction.id}`}
        className="block"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
