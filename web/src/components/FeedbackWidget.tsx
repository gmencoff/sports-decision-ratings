'use client';

import { useState } from 'react';
import { submitFeedback } from '@/app/actions/feedback';

type Status = 'idle' | 'open' | 'submitting' | 'success' | 'error';

export function FeedbackWidget() {
  const [status, setStatus] = useState<Status>('idle');
  const [content, setContent] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openModal() {
    setStatus('open');
    setErrorMessage(null);
  }

  function closeModal() {
    if (status === 'submitting') return;
    setStatus('idle');
    setContent('');
    setErrorMessage(null);
  }

  async function handleSubmit() {
    setStatus('submitting');
    setErrorMessage(null);
    try {
      await submitFeedback({
        content,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      });
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setContent('');
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  const isOpen = status === 'open' || status === 'submitting' || status === 'success' || status === 'error';

  return (
    <>
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 z-50 bg-surface border border-border-default text-text-primary rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
      >
        Feedback
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-surface border border-border-default rounded-xl p-6 max-w-md w-full mx-4 shadow-xl pointer-events-auto">
              <h2 className="text-lg font-semibold text-text-primary mb-1">Send Feedback</h2>
              <p className="text-sm text-text-secondary mb-4">
                Share your thoughts, report issues, or suggest improvements.
              </p>

              {status === 'success' ? (
                <p className="text-green-600 dark:text-green-400 font-medium text-center py-4">
                  Thank you for your feedback!
                </p>
              ) : (
                <>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={5000}
                    disabled={status === 'submitting'}
                    rows={5}
                    placeholder="Your feedback..."
                    className="w-full border border-border-default rounded-lg p-3 text-sm text-text-primary bg-background resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div className="text-xs text-text-secondary text-right mt-1 mb-3">
                    {content.length} / 5000
                  </div>

                  {status === 'error' && errorMessage && (
                    <p className="text-red-600 dark:text-red-400 text-sm mb-3">{errorMessage}</p>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={closeModal}
                      disabled={status === 'submitting'}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={status === 'submitting' || content.trim().length === 0}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {status === 'submitting' ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
