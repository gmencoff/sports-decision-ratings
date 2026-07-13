import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/server/auth/neon-auth-provider', () => ({
  neonAuthProvider: { kind: 'neon' },
}));
vi.mock('@/server/auth/mock-auth-provider', () => ({
  mockAuthProvider: { kind: 'mock' },
}));

import {
  getAuthProvider,
  resetAuthProvider,
  isRealAuthConfigured,
} from '@/server/auth/auth-provider';

describe('auth-provider', () => {
  const originalBaseUrl = process.env.NEON_AUTH_BASE_URL;
  const originalSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  beforeEach(() => {
    resetAuthProvider();
  });

  afterEach(() => {
    if (originalBaseUrl === undefined) delete process.env.NEON_AUTH_BASE_URL;
    else process.env.NEON_AUTH_BASE_URL = originalBaseUrl;
    if (originalSecret === undefined) delete process.env.NEON_AUTH_COOKIE_SECRET;
    else process.env.NEON_AUTH_COOKIE_SECRET = originalSecret;
    resetAuthProvider();
  });

  it('should report auth as not configured when env vars are missing', () => {
    delete process.env.NEON_AUTH_BASE_URL;
    delete process.env.NEON_AUTH_COOKIE_SECRET;

    expect(isRealAuthConfigured()).toBe(false);
  });

  it('should report auth as configured when both env vars are set', () => {
    process.env.NEON_AUTH_BASE_URL = 'https://example.neonauth.tech/auth';
    process.env.NEON_AUTH_COOKIE_SECRET = 'a'.repeat(32);

    expect(isRealAuthConfigured()).toBe(true);
  });

  it('should resolve the mock provider when env vars are missing', async () => {
    delete process.env.NEON_AUTH_BASE_URL;
    delete process.env.NEON_AUTH_COOKIE_SECRET;

    const provider = await getAuthProvider();

    expect(provider).toEqual({ kind: 'mock' });
  });

  it('should resolve the real Neon provider when env vars are set', async () => {
    process.env.NEON_AUTH_BASE_URL = 'https://example.neonauth.tech/auth';
    process.env.NEON_AUTH_COOKIE_SECRET = 'a'.repeat(32);

    const provider = await getAuthProvider();

    expect(provider).toEqual({ kind: 'neon' });
  });
});
