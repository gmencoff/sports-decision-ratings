'use server';

import { getAuthProvider } from '@/server/auth/auth-provider';

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const auth = await getAuthProvider();
  const { error } = await auth.signIn.email({ email, password });
  return error ? { error: error.message ?? 'Failed to sign in. Try again.' } : {};
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string
): Promise<{ error?: string }> {
  const auth = await getAuthProvider();
  const { error } = await auth.signUp.email({ name, email, password });
  return error ? { error: error.message ?? 'Failed to sign up. Try again.' } : {};
}
