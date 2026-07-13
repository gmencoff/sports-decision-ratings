'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/server/auth/auth-client';

export function AuthButton() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

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
    await authClient.signOut();
    router.refresh();
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
