import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Block fetch() in unit tests to catch accidental network calls
const originalFetch = globalThis.fetch;
beforeAll(() => {
  globalThis.fetch = vi.fn(() => {
    throw new Error(
      'fetch() is blocked in unit tests. ' +
        'Use mocks or run integration tests with npm run test:integration'
    );
  });
});

afterEach(() => {
  cleanup();
});

// Restore fetch after all tests (for cleanup)
afterAll(() => {
  globalThis.fetch = originalFetch;
});

// Mock the voter-session module for unit tests
vi.mock('@/server/auth/voter-session', () => ({
  getVoterId: vi.fn().mockResolvedValue('test-voter-id-hash'),
  hashSessionId: vi.fn((sessionId: string) => `hashed-${sessionId}`),
  getOrCreateVoterSessionFromCookies: vi.fn(() => 'test-session-id'),
}));
