import { auth } from '@/server/auth/neon-auth';

export const { GET, POST } = auth.handler();
