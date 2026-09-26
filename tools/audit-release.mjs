#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPOSITORY = "stan-key/extension-source";
const RELEASE_TAG = "latest";
const BROWSERS = ["chrome", "firefox", "safari"];
const ASSET = Object.freeze({
  chrome: { prefix: "stan-chrome-", suffix: ".zip", manifest: "extension/chrome/manifest.json" },
  firefox: { prefix: "stan-firefox-", suffix: ".xpi", manifest: "extension/firefox/manifest.json" },
  safari: { prefix: "stan-safari-webextension-", suffix: ".zip", manifest: "extension/safari/manifest.json" },
});
const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;
const MAX_ENTRIES = 5000;
// Updating a public security/data contract requires a deliberate update to
// these pins in the independent audit tool. This makes a contract expansion
// fail closed even though the public repository keeps one current snapshot.
const APPROVED_CONTRACT_SHA256 = Object.freeze({
  "security/permissions.json": "03aabd059fb1075bc727c569074cf661838fcfea34c306aa6113763e84281477",
  "security/network-allowlist.json": "e64123692dc0924c7ec32cd0870e68b38f4ba97235267962d9ecd1c17950dd04",
  "security/data-contract.json": "845b4ca566fd5ac2cae512fad7d9da1fcea676c3772286bbe196d51297dfb78b",
  "security/main-world-schema.json": "2496aae1237c8861155a332acff4b962d0c2c3c739be47d9369781ce6666dbea",
  "security/snapshot.schema.json": "e7cffec05dceb2ae1cc32b10204718d657f8053eedd0159c8c84b6fa78c95cfd",
});
const EXPECTED_DATA_FLOW_IDS = [
  "extension-install-lifecycle",
  "extension-preferences",
  "extension-session",
  "merchant-action",
  "steam-game-comparison",
  "wishlist-main-world-bridge",
];
const FIREFOX_AMO_SIGNATURE_FILES = [
  "META-INF/cose.manifest",
  "META-INF/cose.sig",
  "META-INF/manifest.mf",
  "META-INF/mozilla.sf",
  "META-INF/mozilla.rsa",
];
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableDigest(value) {
  return sha256(JSON.stringify(value));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function safePath(value) {
  return value.length > 0
    && value.length <= 512
    && !value.startsWith("/")
    && !value.includes("\\")
    && value.split("/").every((part) => part && part !== "." && part !== "..");
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function inspectZip(archive) {
  assert(archive.length <= MAX_ARCHIVE_BYTES, "Archive exceeds the 100 MiB audit limit.");
  let endOffset = -1;
  for (let offset = archive.length - 22; offset >= Math.max(0, archive.length - 65_557); offset -= 1) {
    if (archive.readUInt32LE(offset) === 0x06054b50) { endOffset = offset; break; }
  }
  assert(endOffset >= 0, "ZIP end directory not found.");
  assert(archive.readUInt16LE(endOffset + 4) === 0 && archive.readUInt16LE(endOffset + 6) === 0, "Multi-disk ZIP is not supported.");
  const count = archive.readUInt16LE(endOffset + 10);
  const centralSize = archive.readUInt32LE(endOffset + 12);
  const centralOffset = archive.readUInt32LE(endOffset + 16);
  assert(count > 0 && count <= MAX_ENTRIES, "ZIP entry count is outside the audit limit.");
  assert(centralOffset + centralSize === endOffset, "ZIP central directory is inconsistent.");
  const entries = [];
  const names = new Set();
  let totalBytes = 0;
  let offset = centralOffset;
  for (let index = 0; index < count; index += 1) {
    assert(archive.readUInt32LE(offset) === 0x02014b50, "Invalid ZIP central-directory entry.");
    const creator = archive.readUInt16LE(offset + 4) >>> 8;
    const flags = archive.readUInt16LE(offset + 8);
    const method = archive.readUInt16LE(offset + 10);
    const checksum = archive.readUInt32LE(offset + 16);
    const compressedSize = archive.readUInt32LE(offset + 20);
    const uncompressedSize = archive.readUInt32LE(offset + 24);
    const nameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const externalAttributes = archive.readUInt32LE(offset + 38);
    const localOffset = archive.readUInt32LE(offset + 42);
    const name = archive.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    offset += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith("/")) continue;
    assert(safePath(name), `Unsafe ZIP path: ${name}`);
    assert(!names.has(name), `Duplicate ZIP path: ${name}`);
    names.add(name);
    assert((flags & 1) === 0, `Encrypted ZIP entry is not supported: ${name}`);
    assert(method === 0 || method === 8, `Unsupported ZIP compression method for ${name}.`);
    if (creator === 3) {
      const unixMode = externalAttributes >>> 16;
      assert((unixMode & 0o170000) !== 0o120000, `Symbolic link is not allowed in the archive: ${name}`);
    }
    totalBytes += uncompressedSize;
    assert(totalBytes <= MAX_UNCOMPRESSED_BYTES, "ZIP expands beyond the 200 MiB audit limit.");
    assert(archive.readUInt32LE(localOffset) === 0x04034b50, `Invalid local ZIP header: ${name}`);
    const localNameLength = archive.readUInt16LE(localOffset + 26);
    const localExtraLength = archive.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = archive.subarray(dataOffset, dataOffset + compressedSize);
    const contents = method === 0 ? Buffer.from(compressed) : inflateRawSync(compressed, { maxOutputLength: MAX_UNCOMPRESSED_BYTES });
    assert(contents.length === uncompressedSize && crc32(contents) === checksum, `ZIP integrity check failed for ${name}.`);
    entries.push({ name, contents });
  }
  assert(offset === endOffset, "ZIP central-directory size is inconsistent.");
  return entries;
}

function sourceDigest(entries, browser) {
  const files = entries
    .filter((entry) => !(browser === "firefox" && entry.name.startsWith("META-INF/")))
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
  const digest = createHash("sha256");
  for (const file of files) digest.update(file.name).update("\0").update(file.contents).update("\0");
  return digest.digest("hex");
}

async function directoryEntries(root, directory, relative = "") {
  const result = [];
  for (const entry of await readdir(path.join(root, directory, relative), { withFileTypes: true })) {
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    const childPath = path.join(root, directory, child);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not allowed in the source snapshot: ${childPath}`);
    if (entry.isDirectory()) result.push(...await directoryEntries(root, directory, child));
    else if (entry.isFile()) result.push({ name: child, contents: await readFile(childPath) });
    else throw new Error(`Unsupported entry in the source snapshot: ${childPath}`);
  }
  return result;
}

function auditCode(entries, browser, network) {
  const allowedOrigins = new Set([
    ...(network.runtimeFetchOrigins ?? []),
    ...(network.userNavigationOrigins ?? []),
    "https://store.steampowered.com",
  ]);
  for (const entry of entries) {
    const body = entry.contents.toString("utf8");
    if (/\.(?:js|mjs|html)$/iu.test(entry.name)) {
      assert(!/\beval\s*\(|\bnew\s+Function\s*\(/u.test(body), `${browser}/${entry.name}: dynamic code execution found.`);
      assert(!/\bdocument\.cookie\b|\bchrome\.cookies\b|\bbrowser\.cookies\b/u.test(body), `${browser}/${entry.name}: direct cookie access found.`);
      assert(!/\bimport\s*\(\s*['"]https?:\/\//u.test(body), `${browser}/${entry.name}: remote module import found.`);
      assert(!/<script\b[^>]*\bsrc\s*=\s*['"]https?:\/\//iu.test(body), `${browser}/${entry.name}: remote script element found.`);
      assert(!/\bimportScripts\s*\(\s*['"]https?:\/\//u.test(body), `${browser}/${entry.name}: remote worker import found.`);
    }
    if (!/\.(?:js|mjs|html|css|svg|json)$/iu.test(entry.name)) continue;
    const source = body;
    for (const match of source.matchAll(/https?:\/\/[^\s"'`<>)}]+/gu)) {
      if (match[0].startsWith("http://www.w3.org/") && /\bxmlns(?::[\w.-]+)?\s*=\s*["']http:\/\/www\.w3\.org\//u.test(source)) continue;
      let origin;
      try { origin = new URL(match[0]).origin; } catch { continue; }
      assert(allowedOrigins.has(origin), `${browser}/${entry.name}: undeclared origin ${origin}.`);
    }
  }
}

function parseJson(bytes, label) {
  try { return JSON.parse(Buffer.from(bytes).toString("utf8")); }
  catch { throw new Error(`${label} is not valid JSON.`); }
}

function manifestContract(browser, manifest, permissionsContract) {
  const expected = permissionsContract.browsers[browser];
  assert(manifest.manifest_version === permissionsContract.manifestVersion, `${browser}: manifest_version differs from the approved contract.`);
  assert(JSON.stringify([...(manifest.permissions ?? [])].sort()) === JSON.stringify([...permissionsContract.requiredPermissions].sort()), `${browser}: extension permissions differ from security/permissions.json.`);
  assert(JSON.stringify([...(manifest.host_permissions ?? [])].sort()) === JSON.stringify([...expected.hostPermissions].sort()), `${browser}: host permissions differ from security/permissions.json.`);
  const contentScriptMatches = [...new Set((manifest.content_scripts ?? []).flatMap((entry) => entry.matches ?? []))].sort();
  assert(JSON.stringify(contentScriptMatches) === JSON.stringify([...expected.contentScriptMatches].sort()), `${browser}: content-script matches differ from security/permissions.json.`);
  assert(!(manifest.permissions ?? []).some((item) => permissionsContract.forbiddenPermissions.includes(item)), `${browser}: forbidden extension permission found.`);
  assert(!(manifest.host_permissions ?? []).some((item) => permissionsContract.forbiddenHostPatterns.includes(item)), `${browser}: broad host permission found.`);
  const scripts = (manifest.content_scripts ?? []).flatMap((entry) => entry.js ?? []);
  const mainScripts = (manifest.content_scripts ?? []).filter((entry) => entry.world === "MAIN").flatMap((entry) => entry.js ?? []);
  assert(JSON.stringify([...mainScripts].sort()) === JSON.stringify([...expected.mainWorldScripts].sort()), `${browser}: MAIN-world scripts differ from security/permissions.json.`);
  for (const script of scripts) {
    assert(typeof script === "string" && !script.includes("..") && !script.startsWith("/"), `${browser}: unsafe content-script path.`);
  }
}

async function readFileAt(root, relative) {
  return readFile(path.join(root, relative));
}

function validateSnapshot(snapshot) {
  assert([2, 3].includes(snapshot?.schemaVersion) && snapshot.releaseTag === RELEASE_TAG, "snapshot.json must use schema version 2 or 3 and release tag latest.");
  if (snapshot.schemaVersion === 3) {
    assert(/^[a-f0-9]{64}$/u.test(snapshot.snapshotId ?? ""), "snapshotId is invalid.");
    assert(Number.isFinite(Date.parse(snapshot.generatedAt)), "generatedAt is invalid.");
    assert(/^\d+\.\d+\.\d+$/u.test(snapshot.auditToolVersion ?? ""), "auditToolVersion is invalid.");
    assert(typeof snapshot.publisherVersion === "string" && snapshot.publisherVersion.length > 0, "publisherVersion is missing.");
    assert(snapshot.releaseUrl === "https://github.com/stan-key/extension-source/releases/latest", "releaseUrl does not identify the public current Release.");
    const allowedKeys = ["auditToolVersion", "browsers", "generatedAt", "publisherVersion", "releaseTag", "releaseUrl", "schemaVersion", "snapshotId"];
    assert(JSON.stringify(Object.keys(snapshot).sort()) === JSON.stringify(allowedKeys), "snapshot.json has missing or unexpected top-level fields.");
    const slotKeys = ["artifactName", "manifest", "manifestSha256", "provenance", "providerStatus", "sha256", "sourceDirectory", "sourceSha256", "sourceSnapshotId", "submittedAt", "version"];
    for (const browser of BROWSERS) {
      const slot = snapshot.browsers[browser];
      if (slot === null) continue;
      assert(slot && typeof slot === "object" && !Array.isArray(slot), `${browser}: snapshot slot must be an object or null.`);
      assert(JSON.stringify(Object.keys(slot).sort()) === JSON.stringify(slotKeys), `${browser}: snapshot slot has missing or unexpected fields.`);
      assert(/^\d+(?:\.\d+){0,3}$/u.test(slot.version ?? ""), `${browser}: snapshot version is invalid.`);
      assert(slot.sourceDirectory === `extension/${browser}` && slot.manifest === `extension/${browser}/manifest.json`, `${browser}: snapshot source paths are invalid.`);
      for (const field of ["manifestSha256", "sha256", "sourceSha256", "sourceSnapshotId"]) assert(/^[a-f0-9]{64}$/u.test(slot[field] ?? ""), `${browser}: ${field} is invalid.`);
      assert(typeof slot.providerStatus === "string" && slot.providerStatus.length > 0, `${browser}: providerStatus is missing.`);
      assert(slot.provenance && typeof slot.provenance === "object" && !Array.isArray(slot.provenance), `${browser}: provenance is missing.`);
      assert(slot.providerStatus === validateProvenance(browser, slot), `${browser}: providerStatus does not match verified provenance.`);
      assert(slot.submittedAt === null || Number.isFinite(Date.parse(slot.submittedAt)), `${browser}: submittedAt is invalid.`);
    }
    assert(snapshot.snapshotId === stableDigest({ generatedAt: snapshot.generatedAt, browsers: snapshot.browsers }), "snapshotId does not match snapshot contents.");
  }
  assert(JSON.stringify(Object.keys(snapshot.browsers ?? {}).sort()) === JSON.stringify([...BROWSERS].sort()), "snapshot browser slots are incomplete or unexpected.");
  return snapshot;
}

function validateDataContract(data) {
  assert(data?.schemaVersion === 1 && data.contract === "stan.browser-data.v1", "security/data-contract.json has an unsupported schema.");
  assert(JSON.stringify((data.flows ?? []).map((flow) => flow.id).sort()) === JSON.stringify(EXPECTED_DATA_FLOW_IDS), "The approved browser data-flow inventory changed.");
  const categories = new Set(["functionality", "security", "analytics", "affiliate-attribution"]);
  for (const flow of data.flows) {
    assert(Array.isArray(flow.categories) && flow.categories.length > 0 && flow.categories.every((category) => categories.has(category)), `${flow.id}: data-flow category is missing or unknown.`);
    for (const field of ["source", "read", "sent"]) assert(Array.isArray(flow[field]), `${flow.id}: ${field} must be an array.`);
    for (const field of ["destination", "browserStorage", "purpose", "retention"]) assert(typeof flow[field] === "string" && flow[field].length > 0, `${flow.id}: ${field} is missing.`);
  }
  assert(Array.isArray(data.notCollectedByExtension) && data.notCollectedByExtension.includes("general browser history"), "The data contract must state that general browser history is not collected.");
}

function validateNetworkContract(network) {
  assert(JSON.stringify(network.runtimeFetchOrigins) === JSON.stringify(["https://api.stan-key.com"]), "Runtime network allowlist must identify only the Stan API origin.");
  assert(network.apiHostPermission === "https://api.stan-key.com/*", "Network API host permission differs from the approved origin.");
  assert(network.requestPolicy?.credentials === "omit" && network.requestPolicy?.redirect === "error" && network.requestPolicy?.referrerPolicy === "no-referrer", "Network request policy is incomplete.");
  assert(network.requestPolicy?.timeoutMs === 5000 && network.requestPolicy?.maxResponseBytes === 131072, "Network timeout or response-size bound changed without an audit-tool update.");
  assert(network.executableCode?.remoteScriptsAllowed === false && network.executableCode?.dynamicEvaluationAllowed === false && network.executableCode?.remoteModuleImportsAllowed === false, "Executable-code policy must prohibit remote and dynamic code.");
  assert(network.userNavigationOrigins?.includes("https://chromewebstore.google.com") && network.userNavigationOrigins.includes("https://addons.mozilla.org"), "Official Chrome and Firefox store links must be allowed as user navigation.");
}

function validateProvenance(browser, slot) {
  const value = slot.provenance;
  assert(value && typeof value === "object" && !Array.isArray(value), `${browser}: provider provenance is missing.`);
  if (browser === "safari") assert(value.marketingVersion === slot.version, "Safari provider provenance version differs from the browser slot.");
  else assert(value.version === slot.version, `${browser}: provider provenance version differs from the browser slot.`);
  if (browser === "chrome" && value.legacySnapshot === true) {
    const keys = ["artifactName", "artifactSha256", "event", "legacySnapshot", "provider", "version"].sort();
    assert(JSON.stringify(Object.keys(value).sort()) === JSON.stringify(keys), "Chrome legacy provenance has unexpected fields.");
    assert(value.event === "legacy-snapshot" && value.provider === "chrome-web-store" && value.artifactName === slot.artifactName && value.artifactSha256 === slot.sha256, "Chrome legacy provenance does not match the published slot.");
    return value.event;
  }
  assert(value.schemaVersion === 1 && /^[a-f0-9]{40}$/u.test(value.sourceSha ?? ""), `${browser}: provider source revision is missing or invalid.`);
  if (browser === "chrome") {
    const keys = ["artifactName", "artifactSha256", "event", "publishType", "provider", "schemaVersion", "sourceSha", "submissionState", "version"].sort();
    assert(JSON.stringify(Object.keys(value).sort()) === JSON.stringify(keys), "Chrome provider provenance has unexpected fields.");
    assert(value.provider === "chrome-web-store" && value.event === "submission-succeeded", "Chrome provider event is invalid.");
    assert(["PENDING_REVIEW", "STAGED", "PUBLISHED"].includes(value.submissionState), "Chrome submission state is invalid.");
    assert(["STAGED_PUBLISH", "DEFAULT_PUBLISH"].includes(value.publishType), "Chrome publish type is invalid.");
    assert(value.artifactName === slot.artifactName && value.artifactSha256 === slot.sha256, "Chrome provider provenance does not match the published asset.");
    return value.event;
  }
  if (browser === "firefox") {
    const keys = ["candidateSha256", "channel", "event", "provider", "schemaVersion", "signedArtifactName", "signedSha256", "sourceArchivePublished", "sourceSha", "version"].sort();
    assert(JSON.stringify(Object.keys(value).sort()) === JSON.stringify(keys), "Firefox provider provenance has unexpected fields.");
    assert(value.provider === "amo" && value.event === "listed-signature-succeeded" && value.channel === "listed", "Firefox must identify a listed AMO signing handoff.");
    assert(/^[a-f0-9]{64}$/u.test(value.candidateSha256 ?? "") && value.signedArtifactName === slot.artifactName && value.signedSha256 === slot.sha256 && value.sourceArchivePublished === false, "Firefox provider provenance does not match the signed asset.");
    return value.event;
  }
  const keys = ["buildNumber", "event", "marketingVersion", "platforms", "provider", "safariArtifact", "schemaVersion", "sourceSha", "submitted"].sort();
  assert(JSON.stringify(Object.keys(value).sort()) === JSON.stringify(keys), "Safari provider provenance has unexpected fields.");
  assert(value.provider === "app-store-connect" && value.event === "submit-for-review-succeeded" && value.submitted === true && value.marketingVersion === slot.version, "Safari provider submission provenance is invalid.");
  assert(/^\d+$/u.test(String(value.buildNumber ?? "")), "Safari provider build number is invalid.");
  const platformNames = (value.platforms ?? []).map((platform) => platform?.platform).sort();
  assert(JSON.stringify(platformNames) === JSON.stringify(["IOS", "MAC_OS"]), "Safari provenance must cover iOS and macOS exactly once.");
  assert(value.platforms.every((platform) => ["WAITING_FOR_REVIEW", "IN_REVIEW", "COMPLETE"].includes(platform.state) && String(platform.buildNumber) === String(value.buildNumber)), "Safari platform review state is invalid.");
  assert(value.safariArtifact?.artifactName === slot.artifactName && value.safariArtifact?.artifactSha256 === slot.sha256, "Safari provider provenance does not match the published payload.");
  return value.event;
}

function providerStatusDetail(browser, slot) {
  const value = slot.provenance;
  if (browser === "chrome" && value.legacySnapshot === true) return "legacy snapshot; no provider handoff proof";
  if (browser === "chrome") return `${value.event}; CWS ${value.submissionState}; ${value.publishType}`;
  if (browser === "firefox") return `${value.event}; AMO ${value.channel}`;
  return `${value.event}; iOS ${value.platforms.find((platform) => platform.platform === "IOS")?.state}; macOS ${value.platforms.find((platform) => platform.platform === "MAC_OS")?.state}`;
}

function auditRuntimeSafety(entries, browser, network, mainWorld) {
  const scripts = entries.filter((entry) => /\.(?:js|mjs)$/iu.test(entry.name));
  const bundledCode = scripts.map((entry) => entry.contents.toString("utf8")).join("\n");
  assert(bundledCode.includes('ALLOWED_PRODUCTION_API_HOST="api.stan-key.com"'), `${browser}: production API origin is not visibly constrained in browser code.`);
  assert(bundledCode.includes("validateActionUrl")
    && bundledCode.includes("actionUrl.origin!==normalizedBaseUrl")
    && bundledCode.includes('actionUrl.pathname.startsWith("/r/")')
    && bundledCode.includes('actionId.includes("/")'), `${browser}: first-party action URL validation is missing or changed.`);
  assert(bundledCode.includes("REQUEST_TIMEOUT_MS=5*1e3")
    && bundledCode.includes("MAX_RESPONSE_BYTES=128*1024")
    && bundledCode.includes("AbortController")
    && bundledCode.includes('credentials:"omit"')
    && bundledCode.includes('redirect:"error"')
    && bundledCode.includes('referrerPolicy:"no-referrer"')
    && bundledCode.includes("content-length")
    && bundledCode.includes("API_RESPONSE_TOO_LARGE"), `${browser}: bounded network request or response handling is missing or changed.`);
  const bridgePath = mainWorld.bridge;
  const bridge = entries.find((entry) => entry.name === bridgePath);
  if (browser === "safari") {
    assert((mainWorld.scope ?? []).includes("safari") === false, "Safari unexpectedly enters the MAIN-world bridge contract.");
  return { apiOriginBounded: "PASS", actionUrlValidation: "PASS", boundedNetworkResponses: "PASS", remoteCodeAndCookieAccess: "PASS", mainWorldBridge: "NOT_USED" };
  }
  assert(bridge && (mainWorld.scope ?? []).includes(browser), `${browser}: the declared MAIN-world bridge is missing.`);
  const bridgeSource = bridge.contents.toString("utf8");
  const outputFields = Object.keys(mainWorld.messages?.wishlistItem?.properties?.item?.properties ?? {});
  assert(bridgeSource.includes("postMessage") && bridgeSource.includes("STAN_WISHLIST_ITEM"), `${browser}: MAIN-world bridge message is missing.`);
  assert(outputFields.every((field) => bridgeSource.includes(field)), `${browser}: MAIN-world bridge output differs from its pinned schema.`);
  assert(!/\bfetch\s*\(|\bXMLHttpRequest\b|\bdocument\.cookie\b|\bchrome\./u.test(bridgeSource), `${browser}: MAIN-world bridge has direct network, cookie or extension API access.`);
  return { apiOriginBounded: "PASS", actionUrlValidation: "PASS", boundedNetworkResponses: "PASS", remoteCodeAndCookieAccess: "PASS", mainWorldBridge: "PASS" };
}

async function readApprovedContract(root, relative) {
  const bytes = await readFileAt(root, relative);
  assert(sha256(bytes) === APPROVED_CONTRACT_SHA256[relative], `${relative} differs from the security contract pinned by the audit tool.`);
  return parseJson(bytes, relative);
}

async function checkLocal({ browsers, root = ROOT }) {
  const report = [];
  const snapshotSchema = await readApprovedContract(root, "security/snapshot.schema.json");
  const snapshot = validateSnapshot(parseJson(await readFileAt(root, "snapshot.json"), "snapshot.json"));
  if (snapshot.schemaVersion === 3) assert(snapshotSchema.properties?.schemaVersion?.const === snapshot.schemaVersion, "snapshot.json does not match its pinned schema.");
  const permissions = await readApprovedContract(root, "security/permissions.json");
  const network = await readApprovedContract(root, "security/network-allowlist.json");
  const data = await readApprovedContract(root, "security/data-contract.json");
  const mainWorld = await readApprovedContract(root, "security/main-world-schema.json");
  validateDataContract(data);
  validateNetworkContract(network);
  assert(JSON.stringify(permissions.requiredPermissions) === JSON.stringify(["storage"]), "Approved extension permissions changed.");
  assert(["cookies", "history", "tabs", "webRequest"].every((permission) => permissions.forbiddenPermissions.includes(permission)), "The permissions contract must forbid broad browser data access.");
  assert(mainWorld.transport?.networkAccess === false && mainWorld.transport?.cookieAccess === false && mainWorld.transport?.storageAccess === false && mainWorld.transport?.extensionApiAccess === false, "MAIN-world bridge contract must deny network, cookies, storage and extension APIs.");
  for (const browser of browsers) {
    const slot = snapshot.browsers[browser];
    assert(slot && slot.sourceDirectory === `extension/${browser}`, `${browser}: snapshot slot is empty or has an unexpected source path.`);
    const providerStatus = validateProvenance(browser, slot);
    if (snapshot.schemaVersion === 3) assert(slot.providerStatus === providerStatus, `${browser}: provider status does not match provenance.`);
    assert(/^[a-f0-9]{64}$/u.test(slot.sha256 ?? "") && /^[a-f0-9]{64}$/u.test(slot.sourceSha256 ?? ""), `${browser}: artifact or source checksum is invalid.`);
    if (snapshot.schemaVersion === 3) assert(slot.sourceSnapshotId === stableDigest({ browser, version: slot.version, sourceSha256: slot.sourceSha256, artifactSha256: slot.sha256 }), `${browser}: source snapshot identifier is inconsistent.`);
    const entries = await directoryEntries(root, slot.sourceDirectory);
    const computedSourceSha256 = sourceDigest(entries, browser);
    assert(computedSourceSha256 === slot.sourceSha256, `${browser}: checked-in source directory does not match snapshot source SHA-256.`);
    auditCode(entries, browser, network);
    const sourceBytes = await readFileAt(root, `${slot.sourceDirectory}/manifest.json`);
    const computedManifestSha256 = sha256(sourceBytes);
    if (slot.manifestSha256) assert(computedManifestSha256 === slot.manifestSha256, `${browser}: manifest SHA-256 does not match snapshot.json.`);
    const manifest = parseJson(sourceBytes, `${browser} manifest`);
    assert(manifest.version === slot.version, `${browser}: manifest version differs from snapshot.`);
    manifestContract(browser, manifest, permissions);
    assert(slot.artifactName === `${ASSET[browser].prefix}${slot.version}${ASSET[browser].suffix}`, `${browser}: artifact name is inconsistent.`);
    const bridgeFields = Object.keys(mainWorld.messages?.wishlistItem?.properties?.item?.properties ?? {}).sort();
    const runtimeChecks = auditRuntimeSafety(entries, browser, network, mainWorld);
    report.push({
      browser,
      version: slot.version,
      artifact: slot.artifactName,
      providerStatus: snapshot.schemaVersion === 3 ? slot.providerStatus : providerStatus,
      provenanceStatus: slot.provenance.legacySnapshot === true ? "LEGACY_SNAPSHOT" : "PASS",
      providerStatusDetail: providerStatusDetail(browser, slot),
      manifestVersion: manifest.manifest_version,
      permissions: [...(manifest.permissions ?? [])],
      forbiddenPermissions: [...permissions.forbiddenPermissions],
      forbiddenHostPatterns: [...permissions.forbiddenHostPatterns],
      hostPermissions: [...(manifest.host_permissions ?? [])],
      contentScriptMatches: [...new Set((manifest.content_scripts ?? []).flatMap((entry) => entry.matches ?? []))].sort(),
      mainWorldScripts: [...(manifest.content_scripts ?? []).filter((entry) => entry.world === "MAIN").flatMap((entry) => entry.js ?? [])].sort(),
      mainWorldOutputFields: browser === "safari" ? [] : bridgeFields,
      runtimeFetchOrigins: [...network.runtimeFetchOrigins],
      userNavigationOrigins: [...network.userNavigationOrigins],
      requestPolicy: network.requestPolicy,
      runtimeChecks,
      dataFlows: data.flows.map(({ id, categories }) => ({ id, categories })),
      notCollectedByExtension: [...data.notCollectedByExtension],
      expected: { artifactSha256: slot.sha256, sourceSha256: slot.sourceSha256, manifestSha256: slot.manifestSha256 ?? null },
      computed: { artifactSha256: null, sourceSha256: computedSourceSha256, manifestSha256: computedManifestSha256 },
      providerSignatureFiles: [],
      providerSignatureFileInventory: "NOT_CHECKED",
      status: "PASS",
    });
  }
  return { snapshot, report };
}

async function githubJson(url) {
  const response = await fetch(url, { headers: { accept: "application/vnd.github+json", "user-agent": "stan-extension-audit/1.0.0" }, redirect: "error" });
  assert(response.ok, `GitHub returned ${response.status} for ${url}.`);
  return response.json();
}

async function githubBytes(url) {
  const response = await fetch(url, { headers: { accept: "application/octet-stream", "user-agent": "stan-extension-audit/1.0.0" }, redirect: "follow" });
  assert(response.ok, `GitHub asset download returned ${response.status} for ${url}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.length <= MAX_ARCHIVE_BYTES, "GitHub asset exceeds the 100 MiB audit limit.");
  return bytes;
}

async function checkRemote({ snapshot, browsers, report, root = ROOT }) {
  const api = "https://api.github.com";
  const [repository, main, latest, release] = await Promise.all([
    githubJson(`${api}/repos/${REPOSITORY}`),
    githubJson(`${api}/repos/${REPOSITORY}/git/ref/heads/main`),
    githubJson(`${api}/repos/${REPOSITORY}/git/ref/tags/${RELEASE_TAG}`),
    githubJson(`${api}/repos/${REPOSITORY}/releases/tags/${RELEASE_TAG}`),
  ]);
  const mainSha = main.object?.sha;
  const latestSha = latest.object?.sha;
  assert(repository.private === false, "The public transparency repository is not public.");
  assert(mainSha && mainSha === latestSha, "GitHub main and latest refs do not identify the same commit.");
  assert(release.tag_name === RELEASE_TAG && release.draft === false, "The latest GitHub Release is missing, draft or mis-tagged.");
  const commit = await githubJson(`${api}/repos/${REPOSITORY}/commits/${mainSha}`);
  assert(Array.isArray(commit.parents) && commit.parents.length === 0, "The published snapshot commit has a parent; the single-root-history contract failed.");
  const contents = await githubJson(`${api}/repos/${REPOSITORY}/contents/snapshot.json?ref=${mainSha}`);
  assert(contents.type === "file" && contents.encoding === "base64", "GitHub snapshot.json was not readable as a file.");
  const remoteSnapshot = validateSnapshot(parseJson(Buffer.from(contents.content.replace(/\s/gu, ""), "base64"), "GitHub snapshot.json"));
  assert(stableDigest(remoteSnapshot) === stableDigest(snapshot), "Checked-out snapshot and GitHub main snapshot differ.");
  const head = (await import("node:child_process")).execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  assert(head === mainSha, "The checked-out repository is not the current public main commit.");
  const assets = new Map((release.assets ?? []).map((asset) => [asset.name, asset]));
  const expectedAssets = new Set();
  for (const browser of BROWSERS) {
    const slot = snapshot.browsers[browser];
    if (!slot) continue;
    expectedAssets.add(slot.artifactName);
    expectedAssets.add(`${slot.artifactName}.sha256`);
  }
  assert(assets.size === expectedAssets.size && [...assets.keys()].every((name) => expectedAssets.has(name)),
    "The latest Release contains missing, stale or unexpected browser assets.");
  for (const browser of browsers) {
    const slot = snapshot.browsers[browser];
    const assetName = slot.artifactName;
    const checksumName = `${assetName}.sha256`;
    const asset = assets.get(assetName);
    const checksum = assets.get(checksumName);
    assert(asset && checksum, `${browser}: Release artifact or checksum sidecar is missing.`);
    assert(asset.state === "uploaded" && checksum.state === "uploaded", `${browser}: Release asset upload is incomplete.`);
    const [artifactBytes, checksumBytes, sourceBytes] = await Promise.all([
      githubBytes(asset.browser_download_url), githubBytes(checksum.browser_download_url), readFileAt(root, `${slot.sourceDirectory}/manifest.json`),
    ]);
    const computedArtifactSha256 = sha256(artifactBytes);
    assert(computedArtifactSha256 === slot.sha256, `${browser}: Release artifact SHA-256 differs from snapshot.`);
    const checksumText = checksumBytes.toString("utf8").trim();
    assert(checksumText === `${slot.sha256}  ${assetName}` || checksumText === `${slot.sha256} *${assetName}` || checksumText === slot.sha256,
      `${browser}: checksum sidecar contents do not match the artifact and snapshot.`);
    const archive = inspectZip(artifactBytes);
    const signatureFiles = archive.filter((entry) => entry.name.startsWith("META-INF/")).map((entry) => entry.name).sort();
    if (browser === "firefox") {
      assert(JSON.stringify(signatureFiles) === JSON.stringify([...FIREFOX_AMO_SIGNATURE_FILES].sort()), "Firefox XPI is missing or contains unexpected AMO signature files.");
    } else {
      assert(signatureFiles.length === 0, `${browser}: unexpected provider signature entries were found.`);
    }
    const archivedManifestEntry = archive.find((entry) => entry.name === "manifest.json");
    assert(archivedManifestEntry, `${browser}: Release artifact has no manifest.json at its root.`);
    const archivedManifest = parseJson(archivedManifestEntry.contents, `${browser} artifact manifest`);
    const computedManifestSha256 = sha256(archivedManifestEntry.contents);
    assert(sha256(sourceBytes) === computedManifestSha256, `${browser}: provider artifact manifest and source snapshot are not aligned.`);
    if (slot.manifestSha256) assert(computedManifestSha256 === slot.manifestSha256, `${browser}: manifest hash differs from snapshot.`);
    assert(archivedManifest.version === slot.version, `${browser}: Release artifact version differs from snapshot.`);
    manifestContract(browser, archivedManifest, await readApprovedContract(root, "security/permissions.json"));
    const computedReleaseSourceSha256 = sourceDigest(archive, browser);
    assert(computedReleaseSourceSha256 === slot.sourceSha256, `${browser}: provider artifact source differs from the published source tree.`);
    const browserReport = report.find((item) => item.browser === browser);
    browserReport.computed.artifactSha256 = computedArtifactSha256;
    browserReport.releaseSourceSha256 = computedReleaseSourceSha256;
    browserReport.providerSignatureFiles = signatureFiles;
    browserReport.providerSignatureFileInventory = browser === "firefox" ? "PASS" : "NOT_APPLICABLE";
    browserReport.release = "PASS";
  }
  const [finalMain, finalLatest] = await Promise.all([
    githubJson(`${api}/repos/${REPOSITORY}/git/ref/heads/main`),
    githubJson(`${api}/repos/${REPOSITORY}/git/ref/tags/${RELEASE_TAG}`),
  ]);
  assert(finalMain.object?.sha === mainSha && finalLatest.object?.sha === latestSha,
    "The public snapshot changed while its release assets were being audited; rerun the audit.");
  return { commit: mainSha, releaseUrl: release.html_url };
}

export async function auditRelease({ browsers = BROWSERS, snapshotOnly = false, root = ROOT } = {}) {
  const requested = [...new Set(browsers)];
  assert(requested.length > 0 && requested.every((browser) => BROWSERS.includes(browser)), "Choose chrome, firefox, safari or all.");
  const { snapshot, report } = await checkLocal({ browsers: requested, root });
  let remote = null;
  if (!snapshotOnly) remote = await checkRemote({ snapshot, browsers: requested, report, root });
  const firefoxSignatureStatus = snapshotOnly || !report.some(({ browser }) => browser === "firefox")
    ? "NOT_CHECKED"
    : report.find(({ browser }) => browser === "firefox").providerSignatureFileInventory;
  const checks = [
    { check: "current-snapshot-and-contracts", status: "PASS" },
    { check: "browser-side-security-contract", status: "PASS" },
    { check: "public-data-flow-contract", status: "PASS" },
    ...report.map(({ browser }) => ({ check: "browser-source-and-manifest", browser, status: "PASS" })),
    ...report.map(({ browser }) => ({ check: "action-url-and-bounded-response", browser, status: "PASS" })),
    ...report.map(({ browser, runtimeChecks }) => ({ check: "main-world-bridge", browser, status: runtimeChecks.mainWorldBridge })),
    { check: "firefox-amo-signature-file-inventory", status: firefoxSignatureStatus },
    { check: "github-release-assets-and-source-match", status: snapshotOnly ? "NOT_CHECKED" : "PASS" },
  ];
  return { status: "PASS", snapshotSchemaVersion: snapshot.schemaVersion, snapshotId: snapshot.snapshotId, generatedAt: snapshot.generatedAt, remote, browsers: report, checks,
    officialInstallLinks: {
      chrome: "https://chromewebstore.google.com/detail/ehhomikpbeokopccgmienllpnambnkif",
      firefox: "https://addons.mozilla.org/firefox/addon/stan-steam-price-comparison/",
    } };
}

function parseArgs(argv) {
  const browsers = argv.find((value) => !value.startsWith("--")) ?? "all";
  const allowed = new Set(["all", ...BROWSERS]);
  assert(allowed.has(browsers), "Usage: ./tools/audit-release [all|chrome|firefox|safari] [--snapshot-only] [--json]");
  return { browsers: browsers === "all" ? BROWSERS : [browsers], snapshotOnly: argv.includes("--snapshot-only"), json: argv.includes("--json") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  try {
    const result = await auditRelease(options);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`Stan public extension audit: ${result.status}`);
      console.log(`Snapshot schema v${result.snapshotSchemaVersion}${result.snapshotId ? ` · ${result.snapshotId}` : ""}${result.generatedAt ? ` (${result.generatedAt})` : ""}`);
      if (result.remote) console.log(`GitHub: ${result.remote.commit} · ${result.remote.releaseUrl}`);
      console.log("Browser-side security contract: PASS");
      console.log("Public data-flow contract: PASS");
      console.log(`Artifact/source provenance: ${result.remote ? "PASS" : "NOT_CHECKED"}`);
      for (const browser of result.browsers) {
        console.log(`${browser.browser}: ${browser.status}${browser.release ? ` · Release ${browser.release}` : ""} · ${browser.version} · ${browser.artifact}`);
        console.log(`  provider status: ${browser.providerStatus} · ${browser.providerStatusDetail} · provenance: ${browser.provenanceStatus}`);
        if (browser.browser === "firefox") console.log(`  AMO signature file inventory: ${browser.providerSignatureFileInventory}${browser.providerSignatureFiles.length ? ` · ${browser.providerSignatureFiles.join(", ")}` : ""}`);
        console.log(`  manifest v${browser.manifestVersion} · permissions: ${browser.permissions.join(", ") || "none"}`);
        console.log(`  forbidden permissions/hosts: ${browser.forbiddenPermissions.join(", ")}; ${browser.forbiddenHostPatterns.join(", ")}`);
        console.log(`  hosts: ${browser.hostPermissions.join(", ") || "none"}`);
        console.log(`  pages: ${browser.contentScriptMatches.join(", ") || "none"}`);
        console.log(`  MAIN: ${browser.mainWorldScripts.join(", ") || "none"} · fields: ${browser.mainWorldOutputFields.join(", ") || "none"}`);
        console.log(`  API origins: ${browser.runtimeFetchOrigins.join(", ")}`);
        console.log(`  request bounds: ${browser.requestPolicy.timeoutMs} ms · ${browser.requestPolicy.maxResponseBytes} bytes · redirects ${browser.requestPolicy.redirect}`);
        console.log(`  API origin: ${browser.runtimeChecks.apiOriginBounded} · action URL: ${browser.runtimeChecks.actionUrlValidation} · bounded response: ${browser.runtimeChecks.boundedNetworkResponses}`);
        console.log(`  remote code/cookie patterns: ${browser.runtimeChecks.remoteCodeAndCookieAccess} · MAIN bridge: ${browser.runtimeChecks.mainWorldBridge}`);
        console.log(`  data flows: ${browser.dataFlows.map((flow) => `${flow.id} (${flow.categories.join("/")})`).join(", ")}`);
        console.log(`  artifact SHA-256: expected ${browser.expected.artifactSha256} · calculated ${browser.computed.artifactSha256 ?? "NOT_CHECKED"}`);
        console.log(`  source SHA-256: expected ${browser.expected.sourceSha256} · calculated ${browser.computed.sourceSha256}`);
        if (browser.releaseSourceSha256) console.log(`  extracted release source SHA-256: ${browser.releaseSourceSha256}`);
      }
      console.log(`Official stores: Chrome ${result.officialInstallLinks.chrome} · Firefox ${result.officialInstallLinks.firefox}`);
    }
  } catch (error) {
    const failure = { status: "FAIL", error: error instanceof Error ? error.message : String(error) };
    if (options.json) console.log(JSON.stringify(failure, null, 2));
    else console.error(`Stan public extension audit: FAIL\n${failure.error}`);
    process.exitCode = 1;
  }
}
