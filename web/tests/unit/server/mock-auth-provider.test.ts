import { describe, it, expect, vi } from 'vitest';

function createStatefulCookieJar() {
  const store = new Map<string, string>();
  return {
    get: (name: string) => {
      const value = store.get(name);
      return value ? { value } : undefined;
    },
    set: (name: string, value: string) => {
      if (value === '') {
        store.delete(name);
      } else {
        store.set(name, value);
      }
    },
  };
}

let cookieJar = createStatefulCookieJar();
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(cookieJar),
}));

import { mockAuthProvider } from '@/server/auth/mock-auth-provider';

describe('mockAuthProvider', () => {
  it('should have no session before signing in or up', async () => {
    cookieJar = createStatefulCookieJar();

    const { data } = await mockAuthProvider.getSession();

    expect(data).toBeNull();
  });

  it('should establish a session on sign-up, encoded in the cookie itself', async () => {
    cookieJar = createStatefulCookieJar();

    const { error } = await mockAuthProvider.signUp.email({
      name: 'Test User',
      email: 'signup@example.com',
      password: 'password123',
    });
    expect(error).toBeNull();

    const { data } = await mockAuthProvider.getSession();
    expect(data?.user.email).toBe('signup@example.com');
  });

  it('should establish a session on sign-in for any credentials (no server-side registry)', async () => {
    cookieJar = createStatefulCookieJar();

    const { error } = await mockAuthProvider.signIn.email({
      email: 'signin@example.com',
      password: 'anything',
    });
    expect(error).toBeNull();

    const { data } = await mockAuthProvider.getSession();
    expect(data?.user.email).toBe('signin@example.com');
  });

  it('should assign the same user id for the same email across separate sign-ins', async () => {
    cookieJar = createStatefulCookieJar();
    await mockAuthProvider.signIn.email({ email: 'stable@example.com', password: 'a' });
    const firstId = (await mockAuthProvider.getSession()).data?.user.id;

    cookieJar = createStatefulCookieJar();
    await mockAuthProvider.signIn.email({ email: 'stable@example.com', password: 'b' });
    const secondId = (await mockAuthProvider.getSession()).data?.user.id;

    expect(firstId).toBe(secondId);
  });

  it('should not depend on any cross-request in-memory state (survives a fresh cookie jar with the same cookie value)', async () => {
    cookieJar = createStatefulCookieJar();
    await mockAuthProvider.signUp.email({
      name: 'Portable User',
      email: 'portable@example.com',
      password: 'password123',
    });
    const cookieValue = cookieJar.get('mock_auth_session')?.value;
    expect(cookieValue).toBeDefined();

    // Simulate a completely separate request/module instance that only has
    // the cookie value, not any prior in-memory state.
    const freshJar = createStatefulCookieJar();
    freshJar.set('mock_auth_session', cookieValue!);
    cookieJar = freshJar;

    const { data } = await mockAuthProvider.getSession();
    expect(data?.user.email).toBe('portable@example.com');
  });

  it('should clear the session on sign-out', async () => {
    cookieJar = createStatefulCookieJar();
    await mockAuthProvider.signUp.email({
      name: 'Sign Out User',
      email: 'signout@example.com',
      password: 'password123',
    });

    await mockAuthProvider.signOut();
    const { data } = await mockAuthProvider.getSession();

    expect(data).toBeNull();
  });
});
