import { NextRequest, NextResponse } from 'next/server';
import { getAuthProvider, isRealAuthConfigured } from '@/server/auth/auth-provider';

type RouteContext = { params: Promise<{ path: string[] }> };

// When real Neon Auth is configured, delegate everything to its own REST
// proxy (sign-in, sign-up, OAuth callbacks, etc.). When it's not configured,
// only the two endpoints our client actually calls (get-session, sign-out)
// are implemented, backed by the mock provider.

export async function GET(request: NextRequest, context: RouteContext) {
  if (isRealAuthConfigured()) {
    const { neonAuthHandler } = await import('@/server/auth/neon-auth-provider');
    return neonAuthHandler.GET(request, context);
  }

  const { path } = await context.params;
  if (path.join('/') === 'get-session') {
    const { data } = await (await getAuthProvider()).getSession();
    return NextResponse.json({ data });
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (isRealAuthConfigured()) {
    const { neonAuthHandler } = await import('@/server/auth/neon-auth-provider');
    return neonAuthHandler.POST(request, context);
  }

  const { path } = await context.params;
  if (path.join('/') === 'sign-out') {
    await (await getAuthProvider()).signOut();
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
