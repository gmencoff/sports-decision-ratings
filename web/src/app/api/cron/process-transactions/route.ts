import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDataProvider } from '@/lib/data';
import { processRssFeeds } from '@/server/services/rss-processor';
import { type LlmClient } from '@/server/services/rss-processor/llm-client';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = await getDataProvider();
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const llmClient: LlmClient = {
      createMessage(params) {
        return anthropic.messages.create({
          model: params.model,
          max_tokens: params.max_tokens,
          messages: params.messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        });
      },
    };

    const result = await processRssFeeds(provider, llmClient);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('Cron process-transactions error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
