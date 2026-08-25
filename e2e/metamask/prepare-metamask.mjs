import { createHash } from "node:crypto";
import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const VERSION = "11.9.1";
const SHA256 = "d7547834562ac59256d3e3c21e65d9aae7e43c73c741f2632e9d7d2567341cf9";
const URL = `https://github.com/MetaMask/metamask-extension/releases/download/v${VERSION}/metamask-chrome-${VERSION}.zip`;
const cacheDir = resolve(".cache-synpress");
const extensionDir = join(cacheDir, `metamask-chrome-${VERSION}`);

try {
  const manifest = JSON.parse(await readFile(join(extensionDir, "manifest.json"), "utf8"));
  if (manifest.version === VERSION) process.exit(0);
} catch {}

await mkdir(cacheDir, { recursive: true });
const response = await fetch(URL);
if (!response.ok) throw new Error(`MetaMask download failed: ${response.status} ${response.statusText}`);
const archive = Buffer.from(await response.arrayBuffer());
const actualHash = createHash("sha256").update(archive).digest("hex");
if (actualHash !== SHA256) throw new Error(`MetaMask checksum mismatch: expected ${SHA256}, received ${actualHash}`);

const staging = await mkdtemp(join(tmpdir(), "formo-metamask-extension-"));
const zipPath = join(staging, "metamask.zip");
const unpacked = join(staging, "unpacked");
await mkdir(unpacked);
await writeFile(zipPath, archive, { flag: "wx" });
execFileSync("unzip", ["-q", zipPath, "-d", unpacked], { stdio: "inherit" });
await access(join(unpacked, "manifest.json"));
await rename(unpacked, extensionDir);
await rm(staging, { recursive: true, force: true });
console.log(`Prepared MetaMask ${VERSION} (${actualHash})`);
