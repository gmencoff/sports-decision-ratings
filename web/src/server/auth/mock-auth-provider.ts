import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import type { AuthProvider } from './types';

const MOCK_SESSION_COOKIE = 'mock_auth_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

interface MockSessionPayload {
  id: string;
  email: string;
}

// Deterministic per-email id, short enough that "user:" + this always fits
// in the votes table's varchar(64) voter_id column.
function mockUserId(email: string): string {
  return createHash('sha256').update(email).digest('hex').slice(0, 32);
}

function encodeSession(payload: MockSessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeSession(value: string): MockSessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf-8'));
    return typeof parsed?.id === 'string' && typeof parsed?.email === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

async function setSessionCookie(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MOCK_SESSION_COOKIE, encodeSession({ id: mockUserId(email), email }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

// Local dev/test convenience only, used when Neon Auth env vars aren't set.
// The session is encoded directly in the cookie rather than kept in
// server memory: Next.js doesn't guarantee that Server Actions (which
// handle sign-in/sign-up) and Route Handlers (which handle get-session)
// share the same module instance, so an in-memory user/session store is
// unreliable here — a session created in one can be invisible to the
// other. No password verification or duplicate-email rejection either,
// for the same reason: there's nowhere reliable to keep that registry.
// Signing in or up with any email/password just issues a session for
// that email.
export const mockAuthProvider: AuthProvider = {
  async getSession() {
    const cookieStore = await cookies();
    const raw = cookieStore.get(MOCK_SESSION_COOKIE)?.value;
    const payload = raw ? decodeSession(raw) : null;
    if (!payload) {
      return { data: null };
    }
    return { data: { user: payload } };
  },

  signIn: {
    async email({ email }) {
      await setSessionCookie(email);
      return { error: null };
    },
  },

  signUp: {
    async email({ email }) {
      await setSessionCookie(email);
      return { error: null };
    },
  },

  async signOut() {
    const cookieStore = await cookies();
    cookieStore.set(MOCK_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  },
};
