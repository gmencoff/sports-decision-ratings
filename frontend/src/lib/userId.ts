'use client';

const STORAGE_KEY = 'anonymous_user_id';

export function getUserId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return '';
  }

  let userId = localStorage.getItem(STORAGE_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}
