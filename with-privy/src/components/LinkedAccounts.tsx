"use client";

import { usePrivy, useLinkAccount } from "@privy-io/react-auth";
import { parsePrivyProperties } from "@formo/analytics";
import { useState } from "react";
import { useLinkableMethods } from "@/config/privy";

/**
 * A linked account as it appears in `user.linkedAccounts`.
 *
 * Privy types this as a discriminated union, but the fields we render for
 * display differ per variant. A loose read-only shape keeps the rendering
 * table-driven instead of a 15-branch switch.
 */
type LinkedAccount = {
  type: string;
  address?: string;
  number?: string;
  username?: string | null;
  email?: string | null;
  subject?: string | null;
  displayName?: string | null;
  name?: string | null;
  fid?: number | null;
  telegramUserId?: string;
  credentialId?: string;
  authenticatorName?: string;
  customUserId?: string;
  walletClientType?: string;
  chainType?: string;
};

/** Human label per Privy account type. */
const TYPE_LABELS: Record<string, string> = {
  email: "Email",
  phone: "Phone",
  wallet: "Wallet",
  smart_wallet: "Smart Wallet",
  passkey: "Passkey",
  farcaster: "Farcaster",
  telegram: "Telegram",
  cross_app: "Cross-App",
  custom_auth: "Custom Auth",
  guest: "Guest",
  google_oauth: "Google",
  apple_oauth: "Apple",
  twitter_oauth: "X (Twitter)",
  discord_oauth: "Discord",
  github_oauth: "GitHub",
  linkedin_oauth: "LinkedIn",
  spotify_oauth: "Spotify",
  instagram_oauth: "Instagram",
  tiktok_oauth: "TikTok",
  twitch_oauth: "Twitch",
  line_oauth: "LINE",
};

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Account types this demo knows how to unlink. */
const UNLINKABLE_TYPES = new Set([
  "email",
  "phone",
  "wallet",
  "smart_wallet",
  "passkey",
  "farcaster",
  "telegram",
  "cross_app",
]);

/**
 * Whether this account type is an OAuth provider, and so unlinkable via
 * `unlinkOAuth`. Built-in providers are suffixed `_oauth`; custom OAuth
 * providers are typed `custom:<provider>` and pass through unchanged.
 *
 * Note `custom_auth` (underscore) is NOT this — it's a custom-JWT account, has
 * no `subject`, and is not an OAuth provider.
 */
function isOAuthType(type: string): boolean {
  return type.endsWith("_oauth") || type.startsWith("custom:");
}

/**
 * Whether the demo can unlink this account. `custom_auth` and `guest` are
 * neither OAuth nor separately unlinkable, so their buttons are disabled rather
 * than left to fail.
 */
function isUnlinkable(type: string): boolean {
  return UNLINKABLE_TYPES.has(type) || isOAuthType(type);
}

/** The value shown next to the account label. */
function accountValue(account: LinkedAccount): string {
  switch (account.type) {
    case "email":
      return account.address ?? "—";
    case "phone":
      return account.number ?? "—";
    case "wallet":
    case "smart_wallet":
      return account.address ? shortAddress(account.address) : "—";
    case "passkey":
      return account.authenticatorName ?? account.credentialId ?? "—";
    case "farcaster":
      return account.username ?? (account.fid ? `fid:${account.fid}` : "—");
    case "telegram":
      return account.username ?? account.telegramUserId ?? "—";
    case "custom_auth":
      return account.customUserId ?? "—";
    default:
      return (
        account.username ??
        account.email ??
        account.name ??
        account.subject ??
        "—"
      );
  }
}

export function LinkedAccounts() {
  const privy = usePrivy();
  // What this app can actually link, read from Privy's app config rather than
  // assumed from `loginMethods` — the two are independent.
  const linkable = useLinkableMethods(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ""
  );
  const { user, authenticated } = privy;
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  // Privy fires these once a link flow completes. Formo re-identifies on its
  // own: `user` is reactive, so the page's identify effect re-runs with the new
  // linked account. These callbacks only surface the result — deliberately not
  // a manual re-identify, which would run against a possibly pre-link `user`
  // and emit a redundant, out-of-order identify just before the effect emits
  // the correct one.
  const {
    linkEmail,
    linkPhone,
    linkWallet,
    linkGoogle,
    linkTwitter,
    linkDiscord,
    linkGithub,
    linkFarcaster,
    linkTelegram,
    linkPasskey,
    linkApple,
    linkTiktok,
    linkSpotify,
    linkInstagram,
    linkLinkedIn,
  } = useLinkAccount({
    onSuccess: ({ linkMethod, linkedAccount }) => {
      const label =
        TYPE_LABELS[(linkedAccount as LinkedAccount).type] ?? linkMethod;
      setStatus(`Linked ${label} — Formo will re-identify automatically.`);
      setTimeout(() => setStatus(null), 4000);
    },
    onError: (error) => {
      setStatus(`Link failed: ${error}`);
      setTimeout(() => setStatus(null), 4000);
    },
  });

  if (!authenticated || !user) {
    return (
      <div className="bg-ink-400/25 backdrop-blur rounded-xl p-6 border border-ink-400/60 md:col-span-2">
        <h2 className="text-xl font-semibold text-white mb-2">
          Linked Accounts
        </h2>
        <p className="text-ink-100 text-sm">
          Log in to link additional accounts and wallets to your Privy user.
        </p>
      </div>
    );
  }

  const accounts = (user.linkedAccounts ?? []) as unknown as LinkedAccount[];

  // Privy requires a user to keep at least one linked account, so unlinking the
  // last one always fails. Disable rather than let it error.
  const canUnlink = accounts.length > 1;

  /**
   * Unlink by account type. Each Privy unlink method takes the identifier for
   * that account type (address, number, subject, fid, credential id).
   */
  const unlink = async (account: LinkedAccount) => {
    const key = `${account.type}:${accountValue(account)}`;
    setPending(key);
    try {
      switch (account.type) {
        case "email":
          await privy.unlinkEmail(account.address!);
          break;
        case "phone":
          await privy.unlinkPhone(account.number!);
          break;
        case "wallet":
        case "smart_wallet":
          await privy.unlinkWallet(account.address!);
          break;
        case "passkey":
          await privy.unlinkPasskey(account.credentialId!);
          break;
        case "farcaster":
          await privy.unlinkFarcaster(account.fid!);
          break;
        case "telegram":
          await privy.unlinkTelegram(account.telegramUserId!);
          break;
        case "cross_app":
          await privy.unlinkCrossAppAccount({ subject: account.subject! });
          break;
        default: {
          // `unlinkOAuth` covers every OAuth provider, but ONLY those. Types
          // like `custom_auth` (a custom JWT account) and `guest` are not OAuth
          // and carry no `subject`, so they must not fall through to here.
          if (!isOAuthType(account.type)) {
            throw new Error(
              `Unlinking ${TYPE_LABELS[account.type] ?? account.type} is not supported in this demo`
            );
          }
          // Built-in providers drop the `_oauth` suffix; a custom provider's
          // `custom:<provider>` id is already the provider string.
          const provider = account.type.startsWith("custom:")
            ? account.type
            : account.type.replace(/_oauth$/, "");
          await privy.unlinkOAuth({
            provider: provider as Parameters<
              typeof privy.unlinkOAuth
            >[0]["provider"],
            subject: account.subject!,
          });
        }
      }
      setStatus(
        `Unlinked ${TYPE_LABELS[account.type] ?? account.type}. Note: Formo records wallet↔user links additively, so an unlink is not retracted server-side.`
      );
    } catch (error) {
      setStatus(`Unlink failed: ${(error as Error).message}`);
    } finally {
      setPending(null);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  // Only offer link buttons for account types the user hasn't linked yet.
  // Wallets and passkeys are the exception — Privy allows many of each.
  const linkedTypes = new Set(accounts.map((a) => a.type));
  // `method` is Privy's own loginMethod id, used to check whether the provider
  // is actually enabled for this app. Offering a disabled provider produces a
  // button that simply fails when clicked.
  const linkActions: Array<{
    type: string;
    method: string;
    label: string;
    run: () => void;
  }> = [
    { type: "wallet", method: "wallet", label: "Wallet", run: () => linkWallet() },
    { type: "email", method: "email", label: "Email", run: linkEmail },
    { type: "phone", method: "sms", label: "Phone", run: linkPhone },
    { type: "passkey", method: "passkey", label: "Passkey", run: () => linkPasskey() },
    { type: "google_oauth", method: "google", label: "Google", run: linkGoogle },
    { type: "twitter_oauth", method: "twitter", label: "X (Twitter)", run: linkTwitter },
    { type: "discord_oauth", method: "discord", label: "Discord", run: linkDiscord },
    { type: "github_oauth", method: "github", label: "GitHub", run: linkGithub },
    { type: "apple_oauth", method: "apple", label: "Apple", run: linkApple },
    { type: "linkedin_oauth", method: "linkedin", label: "LinkedIn", run: linkLinkedIn },
    { type: "spotify_oauth", method: "spotify", label: "Spotify", run: linkSpotify },
    { type: "tiktok_oauth", method: "tiktok", label: "TikTok", run: linkTiktok },
    { type: "instagram_oauth", method: "instagram", label: "Instagram", run: linkInstagram },
    { type: "farcaster", method: "farcaster", label: "Farcaster", run: linkFarcaster },
    { type: "telegram", method: "telegram", label: "Telegram", run: () => linkTelegram() },
  ];
  const MULTI_LINKABLE = new Set(["wallet", "passkey"]);
  // Keep providers that aren't enabled yet, but render them disabled with an
  // explanation. Hiding them entirely leaves no discoverable way to add socials
  // — the reader can't tell whether the demo lacks the feature or the app lacks
  // the config. Showing them greyed out makes the next step obvious.
  const availableLinks = linkActions
    .filter((a) => MULTI_LINKABLE.has(a.type) || !linkedTypes.has(a.type))
    // While the config is loading, treat everything as enabled rather than
    // flashing 15 greyed-out buttons.
    .map((a) => ({ ...a, enabled: linkable === null || linkable.has(a.method) }));
  const disabledCount = availableLinks.filter((a) => !a.enabled).length;

  // Exactly what the SDK derives from this user and sends with identify().
  const { properties, wallets } = parsePrivyProperties(user);

  return (
    <div className="bg-ink-400/25 backdrop-blur rounded-xl p-6 border border-ink-400/60 md:col-span-2">
      <h2 className="text-xl font-semibold text-white mb-1">Linked Accounts</h2>
      <p className="text-ink-100 text-sm mb-4">
        Every account linked here belongs to one Privy user (
        <code className="text-lemon-300">{user.id}</code>). Formo identifies all{" "}
        {wallets.length} linked wallet{wallets.length === 1 ? "" : "s"} under
        that DID, so they cluster into a single user instead of{" "}
        {wallets.length} separate ones.
      </p>

      {status && (
        <p className="text-sm text-lemon-300 mb-4 bg-lemon-500/10 border border-lemon-500/30 rounded-lg px-3 py-2">
          {status}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Currently linked */}
        <div>
          <h3 className="text-white font-medium mb-2 text-sm">
            Linked ({accounts.length})
          </h3>
          <div className="space-y-2">
            {accounts.map((account, index) => {
              const key = `${account.type}:${accountValue(account)}`;
              const isWallet =
                account.type === "wallet" || account.type === "smart_wallet";
              return (
                <div
                  key={`${key}-${index}`}
                  className="flex items-center justify-between gap-3 bg-ink-400/25 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <span className="text-ink-50 text-xs block">
                      {TYPE_LABELS[account.type] ?? account.type}
                      {isWallet && account.walletClientType === "privy" && (
                        <span className="ml-2 text-lemon-300">embedded</span>
                      )}
                    </span>
                    <span className="text-white text-sm font-mono break-all">
                      {accountValue(account)}
                    </span>
                  </div>
                  <button
                    onClick={() => unlink(account)}
                    disabled={
                      !canUnlink || pending === key || !isUnlinkable(account.type)
                    }
                    title={
                      !isUnlinkable(account.type)
                        ? "This account type has no unlink method in this demo"
                        : canUnlink
                          ? "Unlink this account"
                          : "Privy requires at least one linked account"
                    }
                    className="shrink-0 text-xs px-2 py-1 rounded border border-danger/40 text-danger hover:bg-danger/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {pending === key ? "…" : "Unlink"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Link more */}
        <div>
          <h3 className="text-white font-medium mb-2 text-sm">Link another</h3>
          <div className="flex flex-wrap gap-2">
            {availableLinks.map((action) =>
              action.enabled ? (
                <button
                  key={action.type}
                  onClick={action.run}
                  className="text-xs px-3 py-1.5 rounded-lg bg-ink-400/25 border border-ink-400 text-ink-50 hover:bg-ink-400/50 hover:border-lemon-500 transition-colors"
                >
                  + {action.label}
                </button>
              ) : (
                <span
                  key={action.type}
                  title={`Enable ${action.label} in the Privy dashboard (Login methods) and reload — no code change needed`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-ink-400/15 border border-dashed border-ink-400/60 text-ink-300 cursor-not-allowed"
                >
                  + {action.label}
                </span>
              )
            )}
          </div>
          {disabledCount > 0 && (
            <p className="text-ink-200 text-xs mt-2">
              {disabledCount} provider{disabledCount === 1 ? " is" : "s are"}{" "}
              greyed out because {disabledCount === 1 ? "it isn't" : "they aren't"}{" "}
              enabled for this app in Privy. To link socials, enable them in the{" "}
              <a
                href="https://dashboard.privy.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lemon-500 hover:underline"
              >
                Privy dashboard
              </a>{" "}
              under <em>Login methods</em>, then reload — this list reads your app
              config, so no code change is needed. Linking a provider that&apos;s
              disabled there rejects with{" "}
              <code className="text-ink-100">
                &quot;Login with X not allowed&quot;
              </code>{" "}
              as an unhandled rejection (it never reaches{" "}
              <code className="text-ink-100">onError</code>), which is why the
              demo disables the button rather than letting it fail silently.
            </p>
          )}

          <h3 className="text-white font-medium mt-6 mb-2 text-sm">
            identify() payload
          </h3>
          <p className="text-ink-200 text-xs mb-2">
            What the SDK sends for <strong>each</strong> of the {wallets.length}{" "}
            linked wallet{wallets.length === 1 ? "" : "s"}: the shared profile
            parsed from <code>user.linkedAccounts</code>, plus that
            wallet&apos;s own metadata.
          </p>
          <pre className="bg-ink-900/70 rounded-lg p-3 text-xs text-ink-50 overflow-x-auto max-h-72">
            {JSON.stringify(
              wallets.map((w) => ({
                address: w.address,
                userId: user.id,
                properties: {
                  ...properties,
                  is_embedded: w.isEmbedded,
                  ...(w.walletClient ? { wallet_client: w.walletClient } : {}),
                  ...(w.chainType ? { chain_type: w.chainType } : {}),
                },
              })),
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
