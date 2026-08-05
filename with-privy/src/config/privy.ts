/**
 * Login methods enabled for this Privy app.
 *
 * This must match what is enabled in the Privy dashboard
 * (https://dashboard.privy.io → your app → Login methods). Calling
 * `linkGoogle()` for a provider that is disabled there fails at runtime, so the
 * UI derives its "Link another" buttons from this list rather than offering
 * every provider the SDK happens to expose.
 *
 * Values are Privy's own `loginMethods` identifiers, so this same array is
 * passed straight to `PrivyProvider`.
 */
export const PRIVY_LOGIN_METHODS = ["wallet", "email"] as const;

export type PrivyLoginMethod = (typeof PRIVY_LOGIN_METHODS)[number];

/** Whether a given Privy login method is enabled for this app. */
export function isLoginMethodEnabled(method: string): boolean {
  return (PRIVY_LOGIN_METHODS as readonly string[]).includes(method);
}
