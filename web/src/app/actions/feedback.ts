'use server';

import { FeedbackProvider, FeedbackInput, getFeedbackProvider } from '@/lib/data/feedback';

export async function submitFeedbackImpl(
  provider: FeedbackProvider,
  input: FeedbackInput
): Promise<void> {
  if (!input.content || input.content.trim().length === 0) {
    throw new Error('Feedback content cannot be empty.');
  }
  if (input.content.length > 5000) {
    throw new Error('Feedback content must be 5000 characters or fewer.');
  }

  await provider.submitFeedback({ ...input, content: input.content.trim() });
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const provider = await getFeedbackProvider();
  return submitFeedbackImpl(provider, input);
}
