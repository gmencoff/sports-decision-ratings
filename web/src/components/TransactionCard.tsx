'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Transaction, Team, VoteCounts, Sentiment } from '@/lib/data/types';
import { VoteButtons } from './VoteButtons';
import { SentimentBar } from './SentimentBar';
import { getModule } from '@/lib/transactions';
import * as votesApi from '@/lib/api/votes';

export interface TeamVoteData {
  counts: VoteCounts;
  userVote: Sentiment | null;
}

interface TeamVoteState extends TeamVoteData {
  isVoting: boolean;
}

export type LoadVotesAction = (
  transactionId: string,
  teams: Team[]
) => Promise<Record<string, TeamVoteData>>;

export type SubmitVoteAction = (
  transactionId: string,
  teamId: string,
  sentiment: Sentiment
) => Promise<VoteCounts>;

interface TransactionCardProps {
  transaction: Transaction;
  loadVotes?: LoadVotesAction;
  submitVote?: SubmitVoteAction;
  showLink?: boolean;
}

export function TransactionCard({
  transaction,
  loadVotes = votesApi.loadVotes,
  submitVote = votesApi.submitVote,
  showLink = true,
}: TransactionCardProps) {
  const [teamVotes, setTeamVotes] = useState<Record<string, TeamVoteState>>({});
  const [votesLoading, setVotesLoading] = useState(true);

  const transactionModule = getModule(transaction.type);
  const CardContent = transactionModule.Card;

  useEffect(() => {
    async function fetchVotes() {
      const votes = await loadVotes(transaction.id, transaction.teams);
      const votesWithLoading: Record<string, TeamVoteState> = {};
      for (const [teamId, voteData] of Object.entries(votes)) {
        votesWithLoading[teamId] = { ...voteData, isVoting: false };
      }
      setTeamVotes(votesWithLoading);
      setVotesLoading(false);
    }

    fetchVotes();
  }, [loadVotes, transaction.id, transaction.teams]);

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
      const newCounts = await submitVote(transaction.id, teamId, sentiment);

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
    <div className="bg-surface rounded-xl shadow-sm border border-border-default p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="inline-block px-2 py-1 text-xs font-medium bg-badge-bg text-badge-text rounded">
          {transactionModule.label}
        </span>
        <span className="text-sm text-text-muted">
          {formatTimestamp(transaction.timestamp)}
        </span>
      </div>

      <div className="mb-4">
        <CardContent transaction={transaction} />
      </div>

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
              className="pt-4 border-t border-border-subtle first:pt-0 first:border-t-0"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <span className="font-medium text-text-primary">{team.name}</span>
                <VoteButtons
                  onVote={(sentiment) => handleVote(team.id, sentiment)}
                  disabled={votesLoading || voteState.isVoting}
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
