import { NextRequest, NextResponse } from 'next/server';
import { getAuthProvider } from '@/server/auth/auth-provider';

type RouteContext = { params: Promise<{ path: string[] }> };

// The client only ever calls these two endpoints (see lib/auth-client.ts) —
// sign-in/sign-up go through Server Actions (app/actions/auth.ts) instead.
// Both endpoints delegate to whichever AuthProvider is active (real Neon
// Auth or the local mock), so this route doesn't need to know which.

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  if (path.join('/') === 'get-session') {
    const { data } = await (await getAuthProvider()).getSession();
    return NextResponse.json({ data });
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  if (path.join('/') === 'sign-out') {
    await (await getAuthProvider()).signOut();
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
