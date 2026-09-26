# Security policy

## Contact

For security questions or reports, contact **contact@stan-key.com**. Include
the affected browser slot and version, its artifact SHA-256 from
[`snapshot.json`](./snapshot.json), the browser and operating-system versions,
and the affected page or feature.

## Scope

This repository covers the public browser-side slots under
[`extension/chrome/`](./extension/chrome/),
[`extension/firefox/`](./extension/firefox/) and
[`extension/safari/`](./extension/safari/), their declared permissions, data
and network contracts, and their correspondence with provider artifacts.
Unexpected permissions, data access, network destinations, remote executable
code, unsafe DOM behavior, redirect handling, or a source/artifact mismatch are
in scope.

## Verification

Run [`./tools/audit-release`](./AUDIT_GUIDE.md) to check a provider slot and
read [`THREAT_MODEL.md`](./THREAT_MODEL.md) for the documented residual risks.
