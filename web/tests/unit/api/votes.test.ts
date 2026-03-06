import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/votes/route';
import { setDataProvider, resetDataProvider } from '@/lib/data';
import { createMockDataProvider } from '../../mocks/mockDataProvider';

// The voter session is mocked in setup.ts to return 'test-voter-id-hash'
const MOCKED_VOTER_ID = 'test-voter-id-hash';

describe('GET /api/votes', () => {
  const mockProvider = createMockDataProvider();

  beforeEach(() => {
    vi.clearAllMocks();
    setDataProvider(mockProvider);
  });

  afterEach(() => {
    resetDataProvider();
  });

  it('should return votes for given transaction and teams', async () => {
    (mockProvider.getVoteCounts as ReturnType<typeof vi.fn>).mockResolvedValue({
      good: 10,
      bad: 5,
      unsure: 2,
    });
    (mockProvider.getUserVote as ReturnType<typeof vi.fn>).mockResolvedValue('good');

    const url = new URL('http://localhost/api/votes');
    url.searchParams.set('transactionId', 'tx-1');
    url.searchParams.set('teamIds', JSON.stringify(['team-1']));

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      'team-1': {
        counts: { good: 10, bad: 5, unsure: 2 },
        userVote: 'good',
      },
    });
    expect(mockProvider.getVoteCounts).toHaveBeenCalledWith('tx-1', 'team-1');
    // Voter ID comes from server-side session (mocked)
    expect(mockProvider.getUserVote).toHaveBeenCalledWith('tx-1', 'team-1', MOCKED_VOTER_ID);
  });

  it('should return votes for multiple teams', async () => {
    (mockProvider.getVoteCounts as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ good: 10, bad: 5, unsure: 2 })
      .mockResolvedValueOnce({ good: 3, bad: 8, unsure: 1 });
    (mockProvider.getUserVote as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce('good')
      .mockResolvedValueOnce(null);

    const url = new URL('http://localhost/api/votes');
    url.searchParams.set('transactionId', 'tx-1');
    url.searchParams.set('teamIds', JSON.stringify(['team-1', 'team-2']));

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      'team-1': {
        counts: { good: 10, bad: 5, unsure: 2 },
        userVote: 'good',
      },
      'team-2': {
        counts: { good: 3, bad: 8, unsure: 1 },
        userVote: null,
      },
    });
  });

  it('should return 400 when transactionId is missing', async () => {
    const url = new URL('http://localhost/api/votes');
    url.searchParams.set('teamIds', JSON.stringify([]));

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required parameters');
  });

  it('should return 400 when teamIds is missing', async () => {
    const url = new URL('http://localhost/api/votes');
    url.searchParams.set('transactionId', 'tx-1');

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required parameters');
  });

  it('should return 400 when teamIds is invalid JSON', async () => {
    const url = new URL('http://localhost/api/votes');
    url.searchParams.set('transactionId', 'tx-1');
    url.searchParams.set('teamIds', 'invalid-json');

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid teamIds parameter');
  });
});

describe('POST /api/votes', () => {
  const mockProvider = createMockDataProvider();

  beforeEach(() => {
    vi.clearAllMocks();
    setDataProvider(mockProvider);
  });

  afterEach(() => {
    resetDataProvider();
  });

  it('should submit a vote and return updated counts', async () => {
    (mockProvider.submitVote as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockProvider.getVoteCounts as ReturnType<typeof vi.fn>).mockResolvedValue({
      good: 11,
      bad: 5,
      unsure: 2,
    });

    const request = new NextRequest('http://localhost/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: 'tx-1',
        teamId: 'team-1',
        sentiment: 'good',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ good: 11, bad: 5, unsure: 2 });
    // Voter ID comes from server-side session (mocked)
    expect(mockProvider.submitVote).toHaveBeenCalledWith({
      transactionId: 'tx-1',
      teamId: 'team-1',
      userId: MOCKED_VOTER_ID,
      sentiment: 'good',
    });
    expect(mockProvider.getVoteCounts).toHaveBeenCalledWith('tx-1', 'team-1');
  });

  it('should accept bad sentiment', async () => {
    (mockProvider.submitVote as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockProvider.getVoteCounts as ReturnType<typeof vi.fn>).mockResolvedValue({
      good: 10,
      bad: 6,
      unsure: 2,
    });

    const request = new NextRequest('http://localhost/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: 'tx-1',
        teamId: 'team-1',
        sentiment: 'bad',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ good: 10, bad: 6, unsure: 2 });
  });

  it('should accept unsure sentiment', async () => {
    (mockProvider.submitVote as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockProvider.getVoteCounts as ReturnType<typeof vi.fn>).mockResolvedValue({
      good: 10,
      bad: 5,
      unsure: 3,
    });

    const request = new NextRequest('http://localhost/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: 'tx-1',
        teamId: 'team-1',
        sentiment: 'unsure',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ good: 10, bad: 5, unsure: 3 });
  });

  it('should return 400 when transactionId is missing', async () => {
    const request = new NextRequest('http://localhost/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        teamId: 'team-1',
        sentiment: 'good',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 when teamId is missing', async () => {
    const request = new NextRequest('http://localhost/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: 'tx-1',
        sentiment: 'good',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 when sentiment is missing', async () => {
    const request = new NextRequest('http://localhost/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: 'tx-1',
        teamId: 'team-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 400 when sentiment is invalid', async () => {
    const request = new NextRequest('http://localhost/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: 'tx-1',
        teamId: 'team-1',
        sentiment: 'invalid',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid sentiment');
  });

  it('should return 400 when body is invalid JSON', async () => {
    const request = new NextRequest('http://localhost/api/votes', {
      method: 'POST',
      body: 'invalid-json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid JSON body');
  });
});
