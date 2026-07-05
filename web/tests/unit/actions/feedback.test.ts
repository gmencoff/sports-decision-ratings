import { describe, it, expect, vi } from 'vitest';
import { submitFeedbackImpl } from '@/app/actions/feedback';
import type { FeedbackProvider, FeedbackInput } from '@/lib/data/feedback';

function createMockFeedbackProvider(
  overrides?: Partial<FeedbackProvider>
): FeedbackProvider {
  return {
    submitFeedback: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('submitFeedbackImpl', () => {
  describe('validation', () => {
    it('should throw when content is empty string', async () => {
      const provider = createMockFeedbackProvider();
      await expect(submitFeedbackImpl(provider, { content: '' })).rejects.toThrow(
        'Feedback content cannot be empty.'
      );
      expect(provider.submitFeedback).not.toHaveBeenCalled();
    });

    it('should throw when content is only whitespace', async () => {
      const provider = createMockFeedbackProvider();
      await expect(submitFeedbackImpl(provider, { content: '   ' })).rejects.toThrow(
        'Feedback content cannot be empty.'
      );
      expect(provider.submitFeedback).not.toHaveBeenCalled();
    });

    it('should throw when content exceeds 5000 characters', async () => {
      const provider = createMockFeedbackProvider();
      const longContent = 'a'.repeat(5001);
      await expect(submitFeedbackImpl(provider, { content: longContent })).rejects.toThrow(
        'Feedback content must be 5000 characters or fewer.'
      );
      expect(provider.submitFeedback).not.toHaveBeenCalled();
    });

    it('should accept content of exactly 5000 characters', async () => {
      const provider = createMockFeedbackProvider();
      await expect(
        submitFeedbackImpl(provider, { content: 'a'.repeat(5000) })
      ).resolves.toBeUndefined();
      expect(provider.submitFeedback).toHaveBeenCalled();
    });
  });

  describe('provider delegation', () => {
    it('should call provider.submitFeedback with trimmed content', async () => {
      const provider = createMockFeedbackProvider();
      await submitFeedbackImpl(provider, { content: '  Great site!  ' });

      expect(provider.submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Great site!' })
      );
    });

    it('should forward pageUrl and userAgent to the provider', async () => {
      const provider = createMockFeedbackProvider();
      await submitFeedbackImpl(provider, {
        content: 'Feedback',
        pageUrl: 'https://example.com/transactions',
        userAgent: 'Mozilla/5.0',
      });

      expect(provider.submitFeedback).toHaveBeenCalledWith({
        content: 'Feedback',
        pageUrl: 'https://example.com/transactions',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should forward undefined pageUrl and userAgent when not provided', async () => {
      const provider = createMockFeedbackProvider();
      await submitFeedbackImpl(provider, { content: 'Feedback' });

      expect(provider.submitFeedback).toHaveBeenCalledWith({
        content: 'Feedback',
        pageUrl: undefined,
        userAgent: undefined,
      });
    });
  });

  describe('provider error propagation', () => {
    it('should propagate errors thrown by the provider', async () => {
      const provider = createMockFeedbackProvider({
        submitFeedback: vi.fn().mockRejectedValue(new Error('DB connection failed')),
      });

      await expect(
        submitFeedbackImpl(provider, { content: 'Valid feedback' })
      ).rejects.toThrow('DB connection failed');
    });
  });
});
