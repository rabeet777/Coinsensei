'use client';

import { useEffect, useState } from 'react';

/** Must match Expo `app.json` → expo.scheme */
const APP_SCHEME = 'coinsensei';
const APP_PATH = 'reset-password';

export default function PasswordResetBridgePage() {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const search = window.location.search || '';
    const hash = window.location.hash || '';
    const deepLink = `${APP_SCHEME}://${APP_PATH}${search}${hash}`;

    window.location.replace(deepLink);

    const t = window.setTimeout(() => setShowFallback(true), 2000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#0a0a0a',
        color: '#e5e5e5',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0 }}>Opening the Coinsensei app…</p>
      {showFallback && (
        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#94a3b8', maxWidth: '24rem' }}>
          If nothing happens,{' '}
          <a
            href={`${APP_SCHEME}://${APP_PATH}${typeof window !== 'undefined' ? `${window.location.search || ''}${window.location.hash || ''}` : ''}`}
            style={{ color: '#09d2fe' }}
          >
            tap here to open the app
          </a>
          , or install Coinsensei from the App Store / Play Store.
        </p>
      )}
    </main>
  );
}
