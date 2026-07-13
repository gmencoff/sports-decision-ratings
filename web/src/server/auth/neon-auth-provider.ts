import { createNeonAuth } from '@neondatabase/auth/next/server';
import type { AuthProvider } from './types';

const neonAuth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

export const neonAuthProvider: AuthProvider = {
  getSession: async () => {
    const { data } = await neonAuth.getSession();
    return { data };
  },
  signIn: {
    email: async (input) => {
      const { error } = await neonAuth.signIn.email(input);
      return { error };
    },
  },
  signUp: {
    email: async (input) => {
      const { error } = await neonAuth.signUp.email(input);
      return { error };
    },
  },
  signOut: async () => {
    await neonAuth.signOut();
  },
};

// The raw Neon Auth REST proxy, used directly by the API route when real
// auth is configured so the full endpoint surface (not just get-session/
// sign-out) is available.
export const neonAuthHandler = neonAuth.handler();
