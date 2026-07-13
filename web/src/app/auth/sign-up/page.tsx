'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signUpWithEmail } from '@/app/actions/auth';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await signUpWithEmail(name, email, password);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    // Hard navigation so the already-mounted header re-fetches session state.
    window.location.href = '/';
  };

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <h1 className="text-xl font-bold text-text-primary">Sign up</h1>

      {error && (
        <div className="rounded bg-red-50 dark:bg-red-950 p-3 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded border border-input-border bg-input-bg text-text-primary px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded border border-input-border bg-input-bg text-text-primary px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded border border-input-border bg-input-bg text-text-primary px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Signing up...' : 'Sign up'}
        </button>
      </form>

      <p className="text-sm text-text-secondary">
        Already have an account?{' '}
        <Link href="/auth/sign-in" className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
