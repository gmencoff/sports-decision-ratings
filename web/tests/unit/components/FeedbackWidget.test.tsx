import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackWidget } from '@/components/FeedbackWidget';

const mockSubmitFeedback = vi.fn();

vi.mock('@/app/actions/feedback', () => ({
  submitFeedback: (...args: unknown[]) => mockSubmitFeedback(...args),
}));

describe('FeedbackWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the floating feedback button', () => {
    render(<FeedbackWidget />);
    expect(screen.getByRole('button', { name: 'Feedback' })).toBeInTheDocument();
  });

  it('does not show modal initially', () => {
    render(<FeedbackWidget />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  describe('opening the modal', () => {
    it('shows the modal when the feedback button is clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByText('Send Feedback')).toBeInTheDocument();
    });
  });

  describe('closing the modal', () => {
    it('closes when Cancel is clicked and resets textarea', async () => {
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      await user.type(screen.getByRole('textbox'), 'some text');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      // Reopen — textarea should be empty
      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('closes when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/40') as HTMLElement;
      await user.click(backdrop);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Submit button state', () => {
    it('is disabled when textarea is empty', async () => {
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));

      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    });

    it('is enabled when textarea has non-whitespace content', async () => {
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      await user.type(screen.getByRole('textbox'), 'Hello');

      expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
    });

    it('is disabled when textarea contains only whitespace', async () => {
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      await user.type(screen.getByRole('textbox'), '   ');

      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    });
  });

  describe('character count', () => {
    it('displays current character count', async () => {
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      expect(screen.getByText('0 / 5000')).toBeInTheDocument();

      await user.type(screen.getByRole('textbox'), 'Hi');
      expect(screen.getByText('2 / 5000')).toBeInTheDocument();
    });
  });

  describe('successful submission', () => {
    it('calls submitFeedback with content, pageUrl, and userAgent', async () => {
      mockSubmitFeedback.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      await user.type(screen.getByRole('textbox'), 'Great feature!');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(mockSubmitFeedback).toHaveBeenCalledWith({
          content: 'Great feature!',
          pageUrl: expect.any(String),
          userAgent: expect.any(String),
        });
      });
    });

    it('shows "Thank you!" message on success', async () => {
      mockSubmitFeedback.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      await user.type(screen.getByRole('textbox'), 'Great feature!');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText(/thank you/i)).toBeInTheDocument();
      });
    });

    it('auto-closes after 2 seconds on success', async () => {
      mockSubmitFeedback.mockResolvedValue(undefined);
      // Use real timers — interact first, then switch to fake timers to control the auto-close
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      await user.type(screen.getByRole('textbox'), 'Great feature!');

      // Switch to fake timers before the submit so we can control setTimeout
      vi.useFakeTimers();
      try {
        // Flush the submit click and async handleSubmit via act
        await act(async () => {
          screen.getByRole('button', { name: 'Submit' }).click();
          // Flush promise microtasks so submitFeedback resolves and status -> 'success'
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(screen.getByText(/thank you/i)).toBeInTheDocument();

        // Advance fake clock to trigger the 2s auto-close setTimeout
        await act(async () => {
          vi.advanceTimersByTime(2000);
        });

        expect(screen.queryByText(/thank you/i)).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('failed submission', () => {
    it('shows error message when submitFeedback throws', async () => {
      mockSubmitFeedback.mockRejectedValue(new Error('Server error'));
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      await user.type(screen.getByRole('textbox'), 'Some feedback');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('shows fallback message for non-Error throws', async () => {
      mockSubmitFeedback.mockRejectedValue('unexpected');
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      await user.type(screen.getByRole('textbox'), 'Some feedback');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
      });
    });

    it('keeps the modal open after an error so user can retry', async () => {
      mockSubmitFeedback.mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();
      render(<FeedbackWidget />);

      await user.click(screen.getByRole('button', { name: 'Feedback' }));
      await user.type(screen.getByRole('textbox'), 'Some feedback');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});
