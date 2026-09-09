import React, { useEffect, useState } from 'react';

interface Props {
  message: string;
  /** Minimum visible duration in ms. Defaults to 3000. */
  durationMs?: number;
  onDismiss?: () => void;
}

/**
 * Toast notification for API errors.
 * Remains visible for at least 3 seconds (durationMs) before auto-dismissing.
 */
export function ErrorNotification({ message, durationMs = 3000, onDismiss }: Props): React.JSX.Element | null {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        background: '#ef4444',
        color: '#fff',
        padding: '0.75rem 1.25rem',
        borderRadius: '0.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 9999,
        maxWidth: '24rem',
      }}
    >
      <strong>Error:</strong> {message}
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        aria-label="Dismiss error"
        style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
      >
        &times;
      </button>
    </div>
  );
}
