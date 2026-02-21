import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TransactionsList } from '@/components/TransactionsList';
import { createMockTransaction } from '../../mocks/mockDataProvider';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the server actions
vi.mock('@/app/actions/transactions', () => ({
  getTransactions: vi.fn(),
}));

// Mock votes API to avoid fetch() calls
vi.mock('@/lib/api/votes', () => ({
  loadVotes: vi.fn().mockResolvedValue({}),
  submitVote: vi.fn().mockResolvedValue({ good: 0, bad: 0, unsure: 0 }),
}));

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
let capturedCallback: IntersectionObserverCallback;
vi.stubGlobal(
  'IntersectionObserver',
  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      capturedCallback = callback;
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = vi.fn();
  }
);

describe('TransactionsList', () => {
  const mockTransactions = [
    createMockTransaction({ id: 'tx-1' }),
    createMockTransaction({ id: 'tx-2' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render initial transactions', () => {
    render(
      <TransactionsList
        initialTransactions={mockTransactions}
        initialHasMore={false}
      />
    );

    // Both transaction cards should be rendered (each team appears multiple times across cards)
    expect(screen.getAllByText('Team A').length).toBeGreaterThanOrEqual(1);
  });

  it('should show empty state when no transactions', () => {
    render(
      <TransactionsList
        initialTransactions={[]}
        initialHasMore={false}
      />
    );

    expect(screen.getByText('No transactions yet. Check back soon!')).toBeInTheDocument();
  });

  it('should load more transactions when sentinel is intersecting', async () => {
    const additionalTransaction = createMockTransaction({ id: 'tx-3' });
    const mockLoadMore = vi.fn().mockResolvedValue({
      data: [additionalTransaction],
      hasMore: false,
      nextCursor: undefined,
    });

    render(
      <TransactionsList
        initialTransactions={mockTransactions}
        initialHasMore={true}
        initialNextCursor="cursor-abc"
        loadMoreTransactions={mockLoadMore}
      />
    );

    // Simulate IntersectionObserver triggering
    expect(mockObserve).toHaveBeenCalled();
    capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    await waitFor(() => {
      expect(mockLoadMore).toHaveBeenCalledWith('cursor-abc');
    });
  });

  it('should not load more when hasMore is false', async () => {
    const mockLoadMore = vi.fn().mockResolvedValue({
      data: [],
      hasMore: false,
    });

    render(
      <TransactionsList
        initialTransactions={mockTransactions}
        initialHasMore={false}
        loadMoreTransactions={mockLoadMore}
      />
    );

    // Simulate IntersectionObserver triggering
    capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    // loadMore should not be called since hasMore is false
    expect(mockLoadMore).not.toHaveBeenCalled();
  });

  it('should append new transactions to the existing list', async () => {
    const additionalTransaction = createMockTransaction({ id: 'tx-3' });
    const mockLoadMore = vi.fn().mockResolvedValue({
      data: [additionalTransaction],
      hasMore: false,
      nextCursor: undefined,
    });

    render(
      <TransactionsList
        initialTransactions={mockTransactions}
        initialHasMore={true}
        initialNextCursor="cursor-abc"
        loadMoreTransactions={mockLoadMore}
      />
    );

    // Initially 2 transactions
    const initialCards = screen.getAllByText('Trade');
    expect(initialCards).toHaveLength(2);

    // Trigger load more
    capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    // After loading, should have 3 transactions
    await waitFor(() => {
      expect(screen.getAllByText('Trade')).toHaveLength(3);
    });
  });
});
