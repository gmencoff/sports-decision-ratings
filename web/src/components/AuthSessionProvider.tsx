'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchSession, signOut as signOutRequest, type SessionUser } from '@/lib/auth-client';

interface AuthSessionContextValue {
  session: { user: SessionUser } | null;
  isPending: boolean;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

// Single source of truth for session state, shared by every component via
// context. Sign-in/sign-up/sign-out all go through this one instance's
// refetch()/signOut(), so every consumer (e.g. the header's AuthButton)
// updates immediately — no page reload needed to propagate a login/logout.
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ user: SessionUser } | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchSession().then((result) => {
      if (!cancelled) {
        setSession(result);
        setIsPending(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = useCallback(async () => {
    const result = await fetchSession();
    setSession(result);
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setSession(null);
  }, []);

  return (
    <AuthSessionContext.Provider value={{ session, isPending, refetch, signOut }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider');
  }
  return context;
}
