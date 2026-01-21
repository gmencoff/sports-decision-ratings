import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionCard } from '@/components/TransactionCard';
import { createMockTransaction } from '../mocks/mockDataProvider';

// Mock getUserId
vi.mock('@/lib/userId', () => ({
  getUserId: vi.fn(() => 'test-user-123'),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('TransactionCard', () => {
  const mockTransaction = createMockTransaction({
    id: 'tx-1',
    title: 'Chiefs trade for Hopkins',
    description: 'Kansas City acquires the veteran receiver',
    teams: [
      { id: 'team-1', name: 'Kansas City Chiefs', abbreviation: 'KC' },
      { id: 'team-2', name: 'Tennessee Titans', abbreviation: 'TEN' },
    ],
  });

  const mockLoadVotes = vi.fn();
  const mockSubmitVote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadVotes.mockResolvedValue({
      'team-1': { counts: { good: 10, bad: 5, unsure: 2 }, userVote: null },
      'team-2': { counts: { good: 3, bad: 8, unsure: 1 }, userVote: 'bad' },
    });
    mockSubmitVote.mockResolvedValue({ good: 11, bad: 5, unsure: 2 });
  });

  it('should render transaction details', async () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        loadVotes={mockLoadVotes}
        submitVote={mockSubmitVote}
      />
    );

    expect(screen.getByText('Chiefs trade for Hopkins')).toBeInTheDocument();
    expect(screen.getByText('Kansas City acquires the veteran receiver')).toBeInTheDocument();
    expect(screen.getByText('Kansas City Chiefs')).toBeInTheDocument();
    expect(screen.getByText('Tennessee Titans')).toBeInTheDocument();
  });

  it('should load votes on mount', async () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        loadVotes={mockLoadVotes}
        submitVote={mockSubmitVote}
      />
    );

    await waitFor(() => {
      expect(mockLoadVotes).toHaveBeenCalledWith(
        'tx-1',
        mockTransaction.teams,
        'test-user-123'
      );
    });
  });

  it('should render as a link when showLink is true', () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        loadVotes={mockLoadVotes}
        submitVote={mockSubmitVote}
        showLink={true}
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/transactions/tx-1');
  });

  it('should not render as a link when showLink is false', () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        loadVotes={mockLoadVotes}
        submitVote={mockSubmitVote}
        showLink={false}
      />
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should call submitVote when user votes', async () => {
    const user = userEvent.setup();

    render(
      <TransactionCard
        transaction={mockTransaction}
        loadVotes={mockLoadVotes}
        submitVote={mockSubmitVote}
        showLink={false}
      />
    );

    // Wait for votes to load
    await waitFor(() => {
      expect(mockLoadVotes).toHaveBeenCalled();
    });

    // Find and click a vote button (Good button for team-1)
    const goodButtons = screen.getAllByRole('button', { name: /good/i });
    await user.click(goodButtons[0]);

    await waitFor(() => {
      expect(mockSubmitVote).toHaveBeenCalledWith(
        'tx-1',
        'team-1',
        'test-user-123',
        'good'
      );
    });
  });

  it('should not submit same vote twice', async () => {
    const user = userEvent.setup();

    // User already voted 'bad' on team-2
    mockLoadVotes.mockResolvedValue({
      'team-1': { counts: { good: 10, bad: 5, unsure: 2 }, userVote: null },
      'team-2': { counts: { good: 3, bad: 8, unsure: 1 }, userVote: 'bad' },
    });

    render(
      <TransactionCard
        transaction={mockTransaction}
        loadVotes={mockLoadVotes}
        submitVote={mockSubmitVote}
        showLink={false}
      />
    );

    await waitFor(() => {
      expect(mockLoadVotes).toHaveBeenCalled();
    });

    // Click 'bad' button for team-2 (already voted)
    const badButtons = screen.getAllByRole('button', { name: /bad/i });
    await user.click(badButtons[1]); // Second bad button is for team-2

    // submitVote should not be called since user already voted 'bad'
    expect(mockSubmitVote).not.toHaveBeenCalled();
  });

  it('should display transaction type label', () => {
    render(
      <TransactionCard
        transaction={mockTransaction}
        loadVotes={mockLoadVotes}
        submitVote={mockSubmitVote}
      />
    );

    expect(screen.getByText('Trade')).toBeInTheDocument();
  });
});
