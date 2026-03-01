import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '@/server/db';
import { getDataProvider } from '@/lib/data';
import { processRssFeeds } from '@/server/services/rss-processor';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const provider = await getDataProvider();
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const result = await processRssFeeds(db, provider, anthropic);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('Cron process-transactions error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
