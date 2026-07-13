export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
}

export interface AuthError {
  message?: string;
}

export interface AuthProvider {
  getSession(): Promise<{ data: AuthSession | null }>;
  signIn: {
    email(input: { email: string; password: string }): Promise<{ error: AuthError | null }>;
  };
  signUp: {
    email(input: { name: string; email: string; password: string }): Promise<{ error: AuthError | null }>;
  };
  signOut(): Promise<void>;
}
