import { createHash } from "node:crypto";
import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const VERSION = "11.9.1";
const SHA256 = "d7547834562ac59256d3e3c21e65d9aae7e43c73c741f2632e9d7d2567341cf9";
const URL = `https://github.com/MetaMask/metamask-extension/releases/download/v${VERSION}/metamask-chrome-${VERSION}.zip`;
const cacheDir = resolve(".cache-synpress");
const extensionDir = join(cacheDir, `metamask-chrome-${VERSION}`);

try {
  const manifest = JSON.parse(await readFile(join(extensionDir, "manifest.json"), "utf8"));
  const cachedHash = (await readFile(join(extensionDir, ".formo-sha256"), "utf8")).trim();
  if (manifest.version === VERSION && cachedHash === SHA256) process.exit(0);
} catch {}

await mkdir(cacheDir, { recursive: true });
let archive;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const response = await fetch(URL, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    archive = Buffer.from(await response.arrayBuffer());
    break;
  } catch (error) {
    if (attempt === 3) throw new Error(`MetaMask download failed after ${attempt} attempts`, { cause: error });
    await delay(attempt * 1_000);
  }
}
if (!archive) throw new Error("MetaMask download produced no archive");
const actualHash = createHash("sha256").update(archive).digest("hex");
if (actualHash !== SHA256) throw new Error(`MetaMask checksum mismatch: expected ${SHA256}, received ${actualHash}`);

// Stage beside the destination so the final rename is atomic and cannot fail
// with EXDEV when the OS temp directory is mounted on another filesystem.
const staging = await mkdtemp(join(cacheDir, ".metamask-extension-"));
const zipPath = join(staging, "metamask.zip");
const unpacked = join(staging, "unpacked");
try {
  await mkdir(unpacked);
  await writeFile(zipPath, archive, { flag: "wx" });
  execFileSync("unzip", ["-q", zipPath, "-d", unpacked], { stdio: "inherit" });
  await access(join(unpacked, "manifest.json"));
  await writeFile(join(unpacked, ".formo-sha256"), `${actualHash}\n`, { flag: "wx" });
  await rm(extensionDir, { recursive: true, force: true });
  await rename(unpacked, extensionDir);
} finally {
  await rm(staging, { recursive: true, force: true });
}
console.log(`Prepared MetaMask ${VERSION} (${actualHash})`);
