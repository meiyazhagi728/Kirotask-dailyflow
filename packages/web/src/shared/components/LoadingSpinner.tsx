import React from 'react';

/**
 * Shown within 100ms of a request starting.
 * Accessible: role="status" with a visually-hidden label.
 */
export function LoadingSpinner(): React.JSX.Element {
  return (
    <div role="status" aria-label="Loading" style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
      <span
        style={{
          display: 'inline-block',
          width: '1.5rem',
          height: '1.5rem',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
