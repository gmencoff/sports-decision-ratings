import type { AuthProvider } from './types';

export function isRealAuthConfigured(): boolean {
  return Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);
}

let instance: AuthProvider | null = null;

export async function getAuthProvider(): Promise<AuthProvider> {
  if (!instance) {
    if (isRealAuthConfigured()) {
      const { neonAuthProvider } = await import('./neon-auth-provider');
      instance = neonAuthProvider;
    } else {
      const { mockAuthProvider } = await import('./mock-auth-provider');
      instance = mockAuthProvider;
    }
  }
  return instance;
}

export function resetAuthProvider(): void {
  instance = null;
}

export function setAuthProvider(provider: AuthProvider): void {
  instance = provider;
}

export * from './types';
