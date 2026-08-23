// Runs the harness across every example that has wagmi or viem installed and
// asserts the EXACT event list per scenario. Exit code is the result.
//
// Usage: node sweep.mjs <sdkPackageDir> [example ...]
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const [, , sdkDir, ...only] = process.argv;
if (!sdkDir) { console.error("usage: node sweep.mjs <sdkPackageDir> [example ...]"); process.exit(2); }

// Which examples run which mode. Wagmi-mode examples subscribe to a store; the
// others are driven through an injected EIP-1193 provider.
const WAGMI = ["with-dynamic", "with-farcaster", "with-metamask", "with-next-page-router", "with-porto", "with-privy", "with-reown", "with-tempo", "with-web3-onboard", "with-react-native"];
const EIP1193 = ["with-react", "with-next-app-router"];

// The one stream every example must produce, whatever its wagmi/viem version.
const EXPECT = {
  wagmi:   ["connect@1", "chain@137", "signature:requested@137", "signature:confirmed@137", "transaction:started@137", "transaction:broadcasted@137", "disconnect@137"],
  eip1193: ["detect@-", "connect@1", "chain@137", "signature:requested@137", "signature:confirmed@137", "transaction:started@137", "transaction:broadcasted@137", "transaction:confirmed@137", "disconnect@137"],
};

const examples = [...WAGMI.map((n) => [n, "wagmi"]), ...EIP1193.map((n) => [n, "eip1193"])]
  .filter(([n]) => only.length === 0 || only.includes(n));

let failed = 0;
for (const [name, mode] of examples) {
  const dir = join(root, name);
  if (!existsSync(join(dir, "node_modules"))) { console.log(`  skip ${name.padEnd(24)} (not installed)`); continue; }
  const r = spawnSync("node", [join(here, "harness.mjs"), sdkDir, dir, mode], { encoding: "utf8" });
  let got;
  try {
    const out = JSON.parse(r.stdout);
    got = out.log.flatMap((s) => s.events).filter((e) => !e.startsWith("page")).map((e) => e.replace(/\/0x[0-9a-fA-F]+$/, ""));
  } catch {
    failed++; console.log(`  FAIL ${name.padEnd(24)} harness crashed\n${(r.stderr || "").split("\n").slice(0, 6).join("\n")}`); continue;
  }
  const want = EXPECT[mode];
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name.padEnd(24)} ${JSON.stringify(got)}${ok ? "" : "\n       want " + JSON.stringify(want)}`);
}
console.log(failed ? `\n${failed} example(s) failed` : `\nall ${examples.length} examples passed`);
process.exit(failed ? 1 : 0);
