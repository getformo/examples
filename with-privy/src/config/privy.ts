"use client";

import { useEffect, useState } from "react";

/**
 * Login methods offered in the Privy login modal.
 *
 * This only controls the *login* UI. It does NOT control what can be linked —
 * see {@link useLinkableMethods}.
 */
export const PRIVY_LOGIN_METHODS = ["wallet", "email"] as const;

export type PrivyLoginMethod = (typeof PRIVY_LOGIN_METHODS)[number];

/**
 * Map this demo's method ids to the flags Privy's app-config API reports.
 * OAuth providers are suffixed `_oauth`; the rest use `_auth`.
 */
const CONFIG_FLAG: Record<string, string> = {
  wallet: "wallet_auth",
  email: "email_auth",
  sms: "sms_auth",
  passkey: "passkey_auth",
  farcaster: "farcaster_auth",
  telegram: "telegram_auth",
  google: "google_oauth",
  twitter: "twitter_oauth",
  discord: "discord_oauth",
  github: "github_oauth",
  apple: "apple_oauth",
  linkedin: "linkedin_oauth",
  spotify: "spotify_oauth",
  instagram: "instagram_oauth",
  tiktok: "tiktok_oauth",
};

/**
 * Which account types this app can actually link, read from Privy's public
 * app-config endpoint.
 *
 * Linking is gated by the **Privy dashboard**, not by the `loginMethods` prop.
 * Adding a provider to `loginMethods` does not make it linkable: with `google`
 * in `loginMethods` but Google disabled in the dashboard, `linkGoogle()`
 * rejects with "Login with Google not allowed" and never opens a flow. Worse,
 * Privy surfaces that as an unhandled promise rejection rather than through
 * `useLinkAccount`'s `onError`, so a naive button just appears to do nothing.
 *
 * Reading the app config is therefore the only honest source of truth for which
 * link buttons can work. Returns `null` while loading so callers can avoid
 * flashing a wrong state.
 */
export function useLinkableMethods(appId: string): Set<string> | null {
  const [methods, setMethods] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!appId) return;
    let cancelled = false;

    fetch(`https://auth.privy.io/api/v1/apps/${appId}`, {
      headers: { "privy-app-id": appId },
      // Bypass the HTTP cache: without this the browser happily serves a
      // response from before you changed anything in the dashboard, so a newly
      // enabled provider stays greyed out until the cached entry expires.
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((config) => {
        if (cancelled || !config) return;
        const enabled = new Set<string>();
        for (const [method, flag] of Object.entries(CONFIG_FLAG)) {
          if (config[flag] === true) enabled.add(method);
        }
        setMethods(enabled);
      })
      .catch(() => {
        // Fall back to the configured login methods: a subset of what's
        // linkable in practice, so the UI under-offers rather than showing
        // buttons that would fail.
        if (!cancelled) setMethods(new Set<string>(PRIVY_LOGIN_METHODS));
      });

    return () => {
      cancelled = true;
    };
  }, [appId]);

  return methods;
}
