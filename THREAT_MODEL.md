# Browser extension threat model

This threat model focuses on the browser packages, their declared permissions,
and the inputs they process.

| Threat | Impact | Browser-side mitigation | Evidence | Remaining consideration |
| --- | --- | --- | --- | --- |
| Steam page or React data is hostile | Page-controlled data could trigger a false comparison or cross-context injection. | Narrow Steam matches; bounded `MAIN` bridge; isolated-world type, size, origin and row checks. | Manifest audit, bridge-schema check and extension tests. | Steam may change its page structure; the bridge can stop working or receive hostile values. |
| DOM tampering or stale prices | A changed row could display an offer against another price or edition. | Re-read and compare app/package IDs and formatted price; expire local cache quickly. | Source-slot checks and package tests. | A malicious page can still mislead its own visible DOM. |
| Malformed or oversized API response | Unexpected content could affect the page or lead to an unsafe action. | JSON-only contract, bounded response, timeout, defensive field parsing, URL allowlist and fail-closed rendering. | Static audit and unit checks. | A malformed response must continue to result in no comparison or action. |
| Unsafe link or URI scheme | A link could send the user to an unexpected destination. | HTTPS-only origins, documented action path checks, bounded action token and safe rendering. | Public slot scan and URL-validation tests. | Always inspect a purchase destination before completing a purchase. |
| Remote code or script injection | A remote script could execute with extension privileges. | Manifest V3, package-only executable scripts, no `eval`/`new Function`, no remote script sources. | Fast audit scans manifests and published JavaScript. | A future store update can change browser behavior; review new versions. |
| Wishlist bridge expansion | New fields could expose more page data. | Exact machine-readable message schema; bridge has no network, cookie, storage or extension API. | Fast audit checks bridge fields and blocked patterns. | The page-world script necessarily shares a JavaScript context with Steam. |
| Permission or host expansion | Broader host access increases the pages the extension can observe. | Per-browser manifest allowlist; no `<all_urls>`, cookies, history, tabs or `webRequest`. | CI compares each manifest with `security/permissions.json`. | Provider-specific permission wording and browser behavior can differ. |
| Persistent identifier misuse | A stable identifier could make separate requests linkable. | Random installation ID, purpose-limited install event, short-lived session token and no account credential. | Machine-readable data contract and extension tests. | The installation ID remains until browser storage is cleared or the extension is removed. |
| API origin substitution | A changed configuration could send Steam context to another host. | Exact API host allowlist and action/logo URL checks. | CI compares runtime destinations with the contract. | DNS, TLS and the configured API origin remain trusted. |
| Response or request resource exhaustion | A broken endpoint could stall the browser or allocate excessive memory. | Five-second timeout, 128 KiB response limit and client wishlist request budget. | Contract checks and extension tests. | Browser resource limits differ by provider. |
| Provider artifact differs from inspected source | A user might inspect source that does not match the distributed package. | Snapshot hashes, checksummed Release assets, package-to-slot hash comparison and provider handoff metadata. | `./tools/audit-release` downloads and compares the artifact and source tree. | SHA-256 proves byte equality, not who created or signed the bytes. |
| A current-only snapshot omits prior permission changes | The repository is replaced with a single-root snapshot for each update. | Audit every current manifest against `security/permissions.json`; compare source, manifest and artifact bytes. | Fast audit and public GitHub Actions. | Keep a local copy of versions you want to compare later. |
| Provider update is compromised | A signed update could change browser behavior. | Store review, exact artifact checks and public audit gates. | Provider listing or signature plus the current snapshot audit. | Review every new version before installing it. |

The audit reports the checks it ran, their results and the current artifact and
source hashes. A `PASS` means those checks matched the bytes and metadata
observed at audit time.
