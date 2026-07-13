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

  it('should create a user and an active session on sign-up', async () => {
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

  it('should reject sign-up with an email that already exists', async () => {
    cookieJar = createStatefulCookieJar();
    await mockAuthProvider.signUp.email({
      name: 'First',
      email: 'duplicate@example.com',
      password: 'password123',
    });

    const { error } = await mockAuthProvider.signUp.email({
      name: 'Second',
      email: 'duplicate@example.com',
      password: 'different',
    });

    expect(error).not.toBeNull();
  });

  it('should sign in an existing user with the correct password', async () => {
    cookieJar = createStatefulCookieJar();
    await mockAuthProvider.signUp.email({
      name: 'Sign In User',
      email: 'signin@example.com',
      password: 'correct-password',
    });
    await mockAuthProvider.signOut();

    const { error } = await mockAuthProvider.signIn.email({
      email: 'signin@example.com',
      password: 'correct-password',
    });
    expect(error).toBeNull();

    const { data } = await mockAuthProvider.getSession();
    expect(data?.user.email).toBe('signin@example.com');
  });

  it('should reject sign-in with the wrong password', async () => {
    cookieJar = createStatefulCookieJar();
    await mockAuthProvider.signUp.email({
      name: 'Wrong Password User',
      email: 'wrongpass@example.com',
      password: 'correct-password',
    });
    await mockAuthProvider.signOut();

    const { error } = await mockAuthProvider.signIn.email({
      email: 'wrongpass@example.com',
      password: 'incorrect',
    });

    expect(error).not.toBeNull();
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
