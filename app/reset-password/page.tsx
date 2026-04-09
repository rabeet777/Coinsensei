'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';

const APP_DEEP_LINK_BASE = 'coinsensei://reset-password';
const ANDROID_PACKAGE = 'com.coinsensei.app';

function buildTail(): string {
  if (typeof window === 'undefined') return '';
  const { hash, search } = window.location;
  if (hash) return hash;
  if (search) return search.startsWith('?') ? search : `?${search}`;
  return '';
}

function hasRecoveryTokens(tail: string): boolean {
  const q = tail.startsWith('#') ? tail.slice(1) : tail.startsWith('?') ? tail.slice(1) : tail;
  const params = new URLSearchParams(q);
  return Boolean(params.get('access_token') && params.get('refresh_token'));
}

/** Chrome intent URI needs query form before #Intent; hash-only Supabase URLs become ?access_token=… */
function tailForAndroidIntent(tail: string): string {
  if (!tail) return '';
  const q = tail.startsWith('#') ? tail.slice(1) : tail.startsWith('?') ? tail.slice(1) : tail;
  return q ? `?${q}` : '';
}

/**
 * Android often drops the URL fragment when opening custom schemes; tokens must be in the query string.
 * iOS also accepts query — use query for the primary deep link everywhere.
 */
function deepLinkWithQueryFromTail(tail: string): string {
  const query = tailForAndroidIntent(tail);
  return query ? `${APP_DEEP_LINK_BASE}${query}` : APP_DEEP_LINK_BASE;
}

function BridgeContent() {
  const [status, setStatus] = useState<'trying' | 'needs-tap' | 'invalid'>('trying');

  const openAppCustomScheme = useCallback(() => {
    const tail = buildTail();
    window.location.href = deepLinkWithQueryFromTail(tail);
  }, []);

  const openAppAndroidIntent = useCallback(() => {
    const tail = buildTail();
    const queryPart = tailForAndroidIntent(tail);
    const intent = `intent://reset-password${queryPart}#Intent;scheme=coinsensei;package=${ANDROID_PACKAGE};end`;
    window.location.href = intent;
  }, []);

  useEffect(() => {
    const tail = buildTail();
    if (!hasRecoveryTokens(tail)) {
      setStatus('invalid');
      return;
    }

    // Prefer query-based deep link so Android delivers access_token / refresh_token to the app.
    openAppCustomScheme();

    const t = window.setTimeout(() => setStatus('needs-tap'), 1800);
    return () => window.clearTimeout(t);
  }, [openAppCustomScheme]);

  if (status === 'invalid') {
    return (
      <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22 }}>Link incomplete</h1>
        <p style={{ opacity: 0.85, lineHeight: 1.5 }}>
          This page should open from your password reset email. If the link expired, request a new reset from the
          Coinsensei app.
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22 }}>Open Coinsensei</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.5 }}>
        {status === 'trying'
          ? 'Switching to the app…'
          : 'If the app did not open, use one of the buttons below (Android may require a tap).'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        <button
          type="button"
          onClick={openAppCustomScheme}
          style={{
            padding: '14px 18px',
            borderRadius: 10,
            border: 'none',
            background: '#e8b84a',
            color: '#111',
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          Open in Coinsensei app
        </button>
        <button
          type="button"
          onClick={openAppAndroidIntent}
          style={{
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid #333',
            background: 'transparent',
            color: '#fafafa',
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Open with Android (intent link)
        </button>
      </div>
    </main>
  );
}

export default function ResetPasswordBridgePage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 24 }}>
          <p style={{ opacity: 0.8 }}>Loading…</p>
        </main>
      }
    >
      <BridgeContent />
    </Suspense>
  );
}
