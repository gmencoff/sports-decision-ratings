'use client';

import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';

export function AuthButton() {
  const { data: session, isPending, refetch } = useSession();

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

  const handleSignOut = async () => {
    await signOut();
    refetch();
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-text-secondary">{session.user.email}</span>
      <button onClick={handleSignOut} className="text-text-primary underline">
        Sign out
      </button>
    </div>
  );
}
