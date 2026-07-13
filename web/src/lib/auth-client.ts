export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Reads the current session via /api/auth/get-session. Works identically
 * whether the server is backed by real Neon Auth or the local mock provider
 * — the caller never needs to know which.
 */
export async function fetchSession(): Promise<{ user: SessionUser } | null> {
  const response = await fetch('/api/auth/get-session', { credentials: 'include' });
  if (!response.ok) {
    return null;
  }
  const json = await response.json();
  return json.data ?? null;
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/sign-out', {
    method: 'POST',
    credentials: 'include',
  });
}
