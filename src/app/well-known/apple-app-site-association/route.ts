import { NextResponse } from "next/server";

/**
 * iOS Universal Links (Apple App Site Association).
 *
 * Served at `/.well-known/apple-app-site-association` via a rewrite in
 * next.config.mjs. Note there is deliberately NO `.json` extension — Apple
 * requires that exact filename, served as `application/json`, over HTTPS with
 * no redirects. `NextResponse.json` sets the content type correctly, which is
 * the usual reason a hand-hosted AASA file silently fails.
 *
 * Scoped to the two paths the app claims: referral invites and the password
 * reset bridge. Everything else on the site stays in the browser.
 *
 * Override in Vercel if the Apple Team ID or bundle changes:
 *   APPLE_TEAM_ID       e.g. 3C9NB84GW7
 *   IOS_BUNDLE_ID       e.g. com.coinsensei.app
 */

/** From ios/Coinsensei.xcodeproj (DEVELOPMENT_TEAM). */
const DEFAULT_TEAM_ID = "3C9NB84GW7";
const DEFAULT_BUNDLE_ID = "com.coinsensei.app";

export const dynamic = "force-static";

export function GET() {
  const teamId = process.env.APPLE_TEAM_ID || DEFAULT_TEAM_ID;
  const bundleId = process.env.IOS_BUNDLE_ID || DEFAULT_BUNDLE_ID;
  const appId = `${teamId}.${bundleId}`;

  return NextResponse.json(
    {
      applinks: {
        details: [
          {
            appIDs: [appId],
            components: [
              {
                "/": "/r/*",
                comment: "Referral invite links open directly in the Coinsensei app",
              },
              {
                "/": "/reset-password",
                comment: "Supabase password recovery links open the in-app reset screen",
              },
              {
                "/": "/reset-password?*",
                comment: "PKCE recovery links carry ?code= in the query string",
              },
            ],
          },
        ],
      },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
