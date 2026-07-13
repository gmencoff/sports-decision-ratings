'use server';

import { auth } from '@/server/auth/neon-auth';

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const { error } = await auth.signIn.email({ email, password });
  return error ? { error: error.message } : {};
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string
): Promise<{ error?: string }> {
  const { error } = await auth.signUp.email({ name, email, password });
  return error ? { error: error.message } : {};
}
