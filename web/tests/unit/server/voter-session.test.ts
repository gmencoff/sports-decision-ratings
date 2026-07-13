import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock the module so we test the real implementation
vi.unmock('@/server/auth/voter-session');

const mockGetSession = vi.fn();
vi.mock('@/server/auth/auth-provider', () => ({
  getAuthProvider: () => Promise.resolve({ getSession: () => mockGetSession() }),
}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
};
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

import {
  hashSessionId,
  getOrCreateVoterSessionFromCookies,
  getVoterId,
  type CookieStore,
} from '@/server/auth/voter-session';

describe('voter-session', () => {
  describe('hashSessionId', () => {
    it('should produce consistent hash for same input', () => {
      const hash1 = hashSessionId('test-session-123');
      const hash2 = hashSessionId('test-session-123');

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashSessionId('session-1');
      const hash2 = hashSessionId('session-2');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce 64-character hex string (SHA-256)', () => {
      const hash = hashSessionId('any-session');

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('getOrCreateVoterSessionFromCookies', () => {
    function createMockCookieStore(): CookieStore & { setCalls: unknown[] } {
      const setCalls: unknown[] = [];
      return {
        get: vi.fn(),
        set: vi.fn((name, value, options) => setCalls.push({ name, value, options })),
        setCalls,
      };
    }

    it('should return existing session if cookie exists', () => {
      const cookieStore = createMockCookieStore();
      (cookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue({ value: 'existing-session' });

      const result = getOrCreateVoterSessionFromCookies(cookieStore);

      expect(result).toBe('existing-session');
      expect(cookieStore.set).not.toHaveBeenCalled();
    });

    it('should create new session if cookie does not exist', () => {
      const cookieStore = createMockCookieStore();
      (cookieStore.get as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

      const result = getOrCreateVoterSessionFromCookies(cookieStore, () => 'new-uuid');

      expect(result).toBe('new-uuid');
      expect(cookieStore.set).toHaveBeenCalledWith(
        'voter_session',
        'new-uuid',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
        })
      );
    });
  });

  describe('getVoterId', () => {
    beforeEach(() => {
      mockGetSession.mockReset();
      mockCookieStore.get.mockReset();
      mockCookieStore.set.mockReset();
    });

    it('should return a user-prefixed id when a session exists, without touching cookies', async () => {
      mockGetSession.mockResolvedValue({ data: { user: { id: 'abc123' } } });

      const result = await getVoterId();

      expect(result).toBe('user:abc123');
      expect(mockCookieStore.get).not.toHaveBeenCalled();
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should fall back to the cookie-based flow when there is no session', async () => {
      mockGetSession.mockResolvedValue({ data: null });
      mockCookieStore.get.mockReturnValue({ value: 'existing-session' });

      const result = await getVoterId();

      expect(result).toBe(hashSessionId('existing-session'));
    });

    it('should create a new anonymous cookie when there is no session and no existing cookie', async () => {
      mockGetSession.mockResolvedValue({ data: null });
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await getVoterId();

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'voter_session',
        expect.any(String),
        expect.objectContaining({ httpOnly: true })
      );
      const [, generatedSessionId] = mockCookieStore.set.mock.calls[0];
      expect(result).toBe(hashSessionId(generatedSessionId));
    });
  });
});
