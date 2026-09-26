# Transparency and provenance

This repository publishes a browser-side source snapshot. It is designed to
make the browser code, permissions, public data fields and provider artifacts
quick to inspect.

## Provider slots

- `extension/chrome/` is derived from the exact Chrome Web Store ZIP.
- `extension/firefox/` is derived from the runtime of the AMO-signed XPI.
- `extension/safari/` is the WebExtension payload extracted from the signed
  Apple build; see [`SAFARI.md`](./SAFARI.md) for what is not included.

Each slot is replaced only after its provider handoff is verified. A browser
version can differ from the other slots. An Apple TestFlight upload alone does
not publish a Safari slot.

## Snapshot and release

[`snapshot.json`](./snapshot.json) records the browser version, provider state,
manifest hash, artifact and source hashes, source snapshot ID, source revision,
timestamp and publisher/audit tool versions. Its structure is defined in
[`security/snapshot.schema.json`](./security/snapshot.schema.json).
[`PRODUCT.json`](./PRODUCT.json) describes the product and browser slots.

`providerStatus` names the proven handoff event; the nested provider record
supplies the provider-specific state. Chrome includes its Web Store submission
state and publish type. Firefox records a successful AMO `listed` signature.
Safari records that the WebExtension payload was submitted to App Review; this
does not claim that the app was approved or released. A migrated
`legacy-snapshot` is labeled as such because it has no provider handoff proof.

The public repository has one root commit. `main` and `latest` point to that
same commit. This repository is a view of the current release and does not
retain earlier snapshots or a history of security-contract changes.

## What a passing audit proves

[`./tools/audit-release`](./AUDIT_GUIDE.md) checks the local snapshot against
GitHub refs and the current Release, verifies the expected asset and checksum,
recomputes the artifact SHA-256, extracts the provider payload, compares it
with the published browser slot, and checks manifests and the machine-readable
contracts.

SHA-256 proves that observed bytes match an expected digest. It does not prove
who created those bytes or how they were built. The Firefox XPI retains its
AMO signature. Browser-store review and Apple signing are provider evidence,
not a cryptographic signature supplied by this repository. No independent
artifact attestation is published today; the current snapshot records the
provider handoff evidence available to Stan.

A passing audit records that the listed checks matched the current files and
provider metadata at audit time. Review each new provider release and its
official store listing before installing an update.

## Product and license

Stan compares the price context displayed by Steam with selected offers. If
the available evidence cannot support a reliable comparison, the purchase
action is withheld.

Stan-authored browser material is available for inspection under
[`LICENSE`](./LICENSE). Third-party components remain under their own terms in
[`THIRD_PARTY_NOTICES.txt`](./THIRD_PARTY_NOTICES.txt).
