import { NextResponse } from "next/server";

/**
 * Android App Links verification (Digital Asset Links).
 *
 * Served at `/.well-known/assetlinks.json` via a rewrite in next.config.mjs —
 * Next ignores `app/` folders that start with a dot, so the real route lives
 * under `/well-known/` and is rewritten.
 *
 * Lets `https://coinsensei.co/r/<CODE>` open the Coinsensei Android app
 * directly instead of the browser. Android fetches this at install time, so it
 * must be live BEFORE users install the app.
 *
 * These values are public by design (a certificate fingerprint and a package
 * name — not secrets), so they ship with working defaults. Override in Vercel
 * only if the signing key or package changes:
 *   ANDROID_PACKAGE_NAME   e.g. com.coinsensei.app
 *   ANDROID_CERT_SHA256    colon-separated fingerprint(s), comma-separated for several
 */

const DEFAULT_PACKAGE = "com.coinsensei.app";

/** Play App Signing key — Play Console → App integrity → App signing. */
const DEFAULT_SHA256 =
  "59:DA:77:EF:DC:B2:45:81:F8:0E:AB:33:78:F4:2E:7C:73:37:E3:06:C9:15:04:6D:7F:EA:74:E5:6C:DA:39:A2";

export const dynamic = "force-static";

export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME || DEFAULT_PACKAGE;

  // Supports several fingerprints (e.g. Play App Signing + an upload key, or
  // during a key rotation).
  const fingerprints = (process.env.ANDROID_CERT_SHA256 || DEFAULT_SHA256)
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean);

  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: packageName,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
