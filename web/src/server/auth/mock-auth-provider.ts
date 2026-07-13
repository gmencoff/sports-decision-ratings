import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import type { AuthProvider, AuthUser } from './types';

const MOCK_SESSION_COOKIE = 'mock_auth_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

interface MockUserRecord extends AuthUser {
  password: string;
}

// In-memory only, never persisted — mirrors MockDataProvider for local dev
// and tests when Neon Auth env vars aren't configured. No password hashing:
// this never talks to a real database or leaves the process.
const usersByEmail = new Map<string, MockUserRecord>();
const usersById = new Map<string, MockUserRecord>();
const sessions = new Map<string, string>(); // token -> user id

async function createSession(userId: string): Promise<void> {
  const token = randomUUID();
  sessions.set(token, userId);
  const cookieStore = await cookies();
  cookieStore.set(MOCK_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

export const mockAuthProvider: AuthProvider = {
  async getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(MOCK_SESSION_COOKIE)?.value;
    const userId = token ? sessions.get(token) : undefined;
    const user = userId ? usersById.get(userId) : undefined;
    if (!user) {
      return { data: null };
    }
    return { data: { user: { id: user.id, email: user.email } } };
  },

  signIn: {
    async email({ email, password }) {
      const user = usersByEmail.get(email);
      if (!user || user.password !== password) {
        return { error: { message: 'Invalid email or password' } };
      }
      await createSession(user.id);
      return { error: null };
    },
  },

  signUp: {
    async email({ email, password }) {
      if (usersByEmail.has(email)) {
        return { error: { message: 'An account with this email already exists' } };
      }
      const user: MockUserRecord = { id: randomUUID(), email, password };
      usersByEmail.set(email, user);
      usersById.set(user.id, user);
      await createSession(user.id);
      return { error: null };
    },
  },

  async signOut() {
    const cookieStore = await cookies();
    const token = cookieStore.get(MOCK_SESSION_COOKIE)?.value;
    if (token) {
      sessions.delete(token);
    }
    cookieStore.set(MOCK_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  },
};
