import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { auditRelease } from "./audit-release.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "stan-public-audit-"));
  await mkdir(path.join(root, "extension/chrome/src"), { recursive: true });
  await mkdir(path.join(root, "security"), { recursive: true });
  const manifest = {
    manifest_version: 3,
    version: "1.2.3",
    permissions: ["storage"],
    host_permissions: ["https://api.stan-key.com/*"],
    content_scripts: [{
      matches: ["https://store.steampowered.com/app/*", "https://store.steampowered.com/wishlist/*"],
      js: ["src/wishlist-bridge.js"],
      world: "MAIN",
    }],
  };
  const sourceFiles = new Map([
    ["manifest.json", Buffer.from(json(manifest))],
    ["src/wishlist-bridge.js", Buffer.from("window.postMessage({type:'STAN_WISHLIST_ITEM', item:{appId, packageId, finalPriceMinor, formattedFinalPrice, includedGameCount, mustPurchaseAsSet}}, location.origin);\n")],
    ["src/background.js", Buffer.from("ALLOWED_PRODUCTION_API_HOST=\"api.stan-key.com\"; REQUEST_TIMEOUT_MS=5*1e3; MAX_RESPONSE_BYTES=128*1024; AbortController; credentials:\"omit\"; redirect:\"error\"; referrerPolicy:\"no-referrer\"; content-length; API_RESPONSE_TOO_LARGE;\n")],
    ["src/content-loader.js", Buffer.from("function validateActionUrl(){ return actionUrl.origin!==normalizedBaseUrl && actionUrl.pathname.startsWith(\"/r/\") && !actionId.includes(\"/\"); }\n")],
  ]);
  for (const [name, contents] of sourceFiles) await writeFile(path.join(root, "extension/chrome", name), contents);
  const sourceDigest = createHash("sha256");
  for (const [name, contents] of [...sourceFiles].sort(([left], [right]) => left.localeCompare(right, "en"))) {
    sourceDigest.update(name).update("\0").update(contents).update("\0");
  }
  for (const name of ["permissions.json", "network-allowlist.json", "data-contract.json", "main-world-schema.json", "snapshot.schema.json"]) {
    const source = new URL(`../security/${name}`, import.meta.url);
    await writeFile(path.join(root, "security", name), await readFile(source));
  }
  const generatedAt = "2026-09-25T09:00:00.000Z";
  const sourceSha256 = sourceDigest.digest("hex");
  const slot = {
    version: "1.2.3",
    providerStatus: "submission-succeeded",
    sourceDirectory: "extension/chrome",
    manifest: "extension/chrome/manifest.json",
    manifestSha256: digest(sourceFiles.get("manifest.json")),
    artifactName: "stan-chrome-1.2.3.zip",
    sha256: "a".repeat(64),
    sourceSha256,
    sourceSnapshotId: digest(JSON.stringify({ browser: "chrome", version: "1.2.3", sourceSha256, artifactSha256: "a".repeat(64) })),
    submittedAt: null,
    provenance: {
      schemaVersion: 1,
      provider: "chrome-web-store",
      event: "submission-succeeded",
      sourceSha: "a".repeat(40),
      version: "1.2.3",
      submissionState: "PUBLISHED",
      publishType: "DEFAULT_PUBLISH",
      artifactName: "stan-chrome-1.2.3.zip",
      artifactSha256: "a".repeat(64),
    },
  };
  const browsers = { chrome: slot, firefox: null, safari: null };
  const snapshotId = digest(JSON.stringify({ generatedAt, browsers }));
  const snapshot = { schemaVersion: 3, snapshotId, generatedAt, releaseTag: "latest", auditToolVersion: "1.0.0", publisherVersion: "1.9.5", browsers, releaseUrl: "https://github.com/stan-key/extension-source/releases/latest" };
  await writeFile(path.join(root, "snapshot.json"), json(snapshot));
  return { root, permissionsPath: path.join(root, "security/permissions.json"), snapshotPath: path.join(root, "snapshot.json") };
}

test("audite un snapshot local conforme sans accès réseau", async () => {
  const value = await fixture();
  try {
    const result = await auditRelease({ browsers: ["chrome"], snapshotOnly: true, root: value.root });
    assert.equal(result.status, "PASS");
    assert.equal(result.browsers[0].browser, "chrome");
    assert.equal(result.browsers[0].status, "PASS");
    assert.equal(result.browsers[0].manifestVersion, 3);
    assert.deepEqual(result.browsers[0].permissions, ["storage"]);
    assert.equal(result.browsers[0].runtimeChecks.actionUrlValidation, "PASS");
    assert.equal(result.browsers[0].runtimeChecks.boundedNetworkResponses, "PASS");
    assert.equal(result.browsers[0].expected.sourceSha256, result.browsers[0].computed.sourceSha256);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

test("audite aussi le snapshot v2 public courant pendant la migration de format", async () => {
  const value = await fixture();
  try {
    const snapshot = JSON.parse(await readFile(value.snapshotPath, "utf8"));
    for (const slot of Object.values(snapshot.browsers)) {
      if (!slot) continue;
      delete slot.providerStatus;
      delete slot.manifestSha256;
      delete slot.sourceSnapshotId;
      delete slot.submittedAt;
    }
    const legacy = {
      schemaVersion: 2,
      releaseTag: "latest",
      browsers: snapshot.browsers,
      releaseUrl: "https://github.com/stan-key/extension-source/releases/latest",
    };
    await writeFile(value.snapshotPath, json(legacy));
    const result = await auditRelease({ browsers: ["chrome"], snapshotOnly: true, root: value.root });
    assert.equal(result.status, "PASS");
    assert.equal(result.browsers[0].expected.artifactSha256, "a".repeat(64));
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

test("échoue fermé quand la permission publiée diverge du contrat", async () => {
  const value = await fixture();
  try {
    await writeFile(value.permissionsPath, json({ schemaVersion: 1, requiredPermissions: ["storage", "tabs"], forbiddenPermissions: ["cookies", "history", "tabs", "webRequest"], browsers: { chrome: { hostPermissions: [], contentScriptMatches: [], mainWorldScripts: [] } } }));
    await assert.rejects(auditRelease({ browsers: ["chrome"], snapshotOnly: true, root: value.root }), /differs from the security contract pinned by the audit tool/u);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});
