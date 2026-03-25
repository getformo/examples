"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormo } from "@formo/analytics";

function parseCookies(): Record<string, string> {
  return Object.fromEntries(
    document.cookie.split("; ").filter(Boolean).map(c => {
      const [key, ...rest] = c.split("=");
      return [key, rest.join("=")];
    }),
  );
}

export default function CookiesTestPage() {
  const analytics = useFormo();
  const [cookies, setCookies] = useState<Record<string, string>>({});
  const [hostname, setHostname] = useState("");

  const refresh = useCallback(() => {
    setCookies(parseCookies());
    setHostname(window.location.hostname);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const formoKeys = ["anonymous-id", "user-id", "wallet-detected", "wallet-identified", "analytics-current-url"];
  const formoCookies = Object.entries(cookies).filter(
    ([k]) => formoKeys.includes(k) || k.startsWith("formo_") || k.startsWith("__formo"),
  );
  const otherCookies = Object.entries(cookies).filter(
    ([k]) => !formoKeys.includes(k) && !k.startsWith("formo_") && !k.startsWith("__formo"),
  );

  return (
    <div className="flex flex-col items-center pt-10 px-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Cross-Subdomain Cookies Test</h1>
      <p className="text-lg mb-6 text-gray-600">
        Current hostname: <code className="bg-base-300 px-2 py-1 rounded font-bold">{hostname}</code>
      </p>

      {/* Instructions */}
      <div className="w-full max-w-2xl mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <p className="font-semibold mb-2">How to test:</p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>
            Visit <code className="bg-blue-100 px-1 rounded">http://app.lvh.me:3002/cookies</code> &mdash; note the{" "}
            <code>anonymous-id</code> cookie value and its domain
          </li>
          <li>
            Visit <code className="bg-blue-100 px-1 rounded">http://www.lvh.me:3002/cookies</code> &mdash; the{" "}
            <code>anonymous-id</code> should be the <strong>same value</strong> (shared via <code>.lvh.me</code>)
          </li>
          <li>
            Set <code>crossSubdomainCookies: false</code> in the provider options, restart, and repeat &mdash; the
            cookie should differ between subdomains
          </li>
        </ol>
      </div>

      {/* SDK status */}
      <div className="w-full max-w-2xl mb-6">
        <div
          className={`p-3 rounded-lg border ${analytics ? "bg-green-50 border-green-300 text-green-800" : "bg-yellow-50 border-yellow-300 text-yellow-800"}`}
        >
          SDK status: <strong>{analytics ? "Initialized" : "Loading..."}</strong>
        </div>
      </div>

      {/* Formo cookies table */}
      <div className="w-full max-w-2xl mb-6">
        <h2 className="text-xl font-semibold mb-3">Formo Cookies ({formoCookies.length})</h2>
        {formoCookies.length === 0 ? (
          <p className="text-gray-500 italic">No Formo cookies found yet. SDK may still be initializing.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {formoCookies.map(([key, value]) => (
                <tr key={key}>
                  <td className="border border-gray-300 px-3 py-2 font-mono font-semibold">{key}</td>
                  <td className="border border-gray-300 px-3 py-2 font-mono break-all">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Other cookies */}
      {otherCookies.length > 0 && (
        <div className="w-full max-w-2xl mb-6">
          <h2 className="text-xl font-semibold mb-3">Other Cookies ({otherCookies.length})</h2>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {otherCookies.map(([key, value]) => (
                <tr key={key}>
                  <td className="border border-gray-300 px-3 py-2 font-mono">{key}</td>
                  <td className="border border-gray-300 px-3 py-2 font-mono break-all">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Refresh button */}
      <button onClick={refresh} className="mb-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        Refresh Cookies
      </button>

      {/* Tip */}
      <div className="w-full max-w-2xl mb-10 p-3 bg-gray-50 border rounded text-sm text-gray-600">
        <strong>Tip:</strong> Open DevTools &rarr; Application &rarr; Cookies to see the <code>Domain</code> column.
        With <code>crossSubdomainCookies: true</code> (default), <code>anonymous-id</code> should be on{" "}
        <code>.lvh.me</code>. With <code>false</code>, it should be on <code>app.lvh.me</code> only.
      </div>
    </div>
  );
}
