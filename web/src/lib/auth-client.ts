'use client';

import { useEffect, useState } from 'react';

export interface SessionUser {
  id: string;
  email: string;
}

interface UseSessionResult {
  data: { user: SessionUser } | null;
  isPending: boolean;
  refetch: () => void;
}

async function fetchSession(): Promise<{ user: SessionUser } | null> {
  const response = await fetch('/api/auth/get-session', { credentials: 'include' });
  if (!response.ok) {
    return null;
  }
  const json = await response.json();
  return json.data ?? null;
}

/**
 * Reads the current session via /api/auth/get-session. Works identically
 * whether the server is backed by real Neon Auth or the local mock provider
 * — the client never needs to know which.
 */
export function useSession(): UseSessionResult {
  const [data, setData] = useState<{ user: SessionUser } | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [refetchCount, setRefetchCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchSession().then((session) => {
      if (!cancelled) {
        setData(session);
        setIsPending(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refetchCount]);

  const refetch = () => setRefetchCount((count) => count + 1);

  return { data, isPending, refetch };
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/sign-out', {
    method: 'POST',
    credentials: 'include',
  });
}
