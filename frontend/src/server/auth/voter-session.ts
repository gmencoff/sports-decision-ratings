import { cookies } from 'next/headers';
import { createHash, randomUUID } from 'crypto';

const VOTER_SESSION_COOKIE = 'voter_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

// Cookie store interface for dependency injection
export interface CookieStore {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: Record<string, unknown>): void;
}

export async function getVoterId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionId = getOrCreateVoterSessionFromCookies(cookieStore);
  return hashSessionId(sessionId);
}

// Testable function with injected dependencies
export function getOrCreateVoterSessionFromCookies(
  cookieStore: CookieStore,
  generateId: () => string = randomUUID
): string{
  const existing = cookieStore.get(VOTER_SESSION_COOKIE);

  if (existing?.value) {
    return existing.value
  }

  const sessionId = generateId();
  cookieStore.set(VOTER_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return sessionId
}

export function hashSessionId(sessionId: string): string {
  return createHash('sha256').update(sessionId).digest('hex');
}
