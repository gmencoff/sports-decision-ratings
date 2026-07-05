import { getDb, type Database } from '@/server/db';
import { feedback } from '@/server/db/schema/feedback';
import { resolveProvider } from './provider-factory';

export interface FeedbackInput {
  content: string;
  pageUrl?: string;
  userAgent?: string;
}

export interface FeedbackProvider {
  submitFeedback(input: FeedbackInput): Promise<void>;
}

export class PostgresFeedbackProvider implements FeedbackProvider {
  private db: Database;

  constructor(db?: Database) {
    this.db = db ?? getDb();
  }

  async submitFeedback(input: FeedbackInput): Promise<void> {
    await this.db.insert(feedback).values({
      id: crypto.randomUUID(),
      content: input.content,
      pageUrl: input.pageUrl,
      userAgent: input.userAgent,
    });
  }
}

export class MockFeedbackProvider implements FeedbackProvider {
  readonly submitted: FeedbackInput[] = [];

  async submitFeedback(input: FeedbackInput): Promise<void> {
    console.log('MockFeedbackProvider: submitFeedback called with:', input);
    this.submitted.push(input);
  }
}

let instance: FeedbackProvider | null = null;

export async function getFeedbackProvider(): Promise<FeedbackProvider> {
  if (!instance) {
    instance = await resolveProvider<FeedbackProvider>({
      createPostgres: () => new PostgresFeedbackProvider(),
      createMock: () => new MockFeedbackProvider(),
    });
  }
  return instance;
}

export function resetFeedbackProvider(): void { instance = null; }
export function setFeedbackProvider(provider: FeedbackProvider): void { instance = provider; }
