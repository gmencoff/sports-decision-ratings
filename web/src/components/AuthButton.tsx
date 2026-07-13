'use client';

import Link from 'next/link';
import { useAuthSession } from '@/components/AuthSessionProvider';

export function AuthButton() {
  const { session, isPending, signOut } = useAuthSession();

  if (isPending) {
    return null;
  }

  if (!session) {
    return (
      <Link href="/auth/sign-in" className="text-sm text-text-primary underline">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-text-secondary">{session.user.email}</span>
      <button onClick={() => signOut()} className="text-text-primary underline">
        Sign out
      </button>
    </div>
  );
}
