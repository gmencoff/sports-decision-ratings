import { describe, it, expect, vi } from 'vitest';

// Unmock the module so we test the real implementation
vi.unmock('@/server/auth/voter-session');

import {
  hashSessionId,
  getOrCreateVoterSessionFromCookies,
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
});
