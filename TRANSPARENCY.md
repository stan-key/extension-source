# Transparency by design

Stan asks for very little and shows you everything it asks for. This page
explains where each browser package comes from, how this repository is
published and exactly what a passing audit proves.

## Our commitments

**The code is published.**
The browser code of every store package Stan distributes is published here, in
readable form, under [`extension/`](./extension/).

**Every store is accounted for.**
Each browser has its own slot, replaced only after its store handoff is
verified.

**Every byte can be checked.**
[`./tools/audit-release`](./AUDIT_GUIDE.md) compares store packages with this
repository and reports `PASS`, `FAIL` or `NOT_CHECKED` for each check.

**Limits are stated plainly.**
A checksum proves equality, not authorship. We say so, and we say what the
provider's own evidence covers.

## Where each package comes from

| Slot | Comes from | Installed through |
| --- | --- | --- |
| [`extension/chrome/`](./extension/chrome/) | The exact ZIP submitted to the Chrome Web Store | Chrome Web Store; Microsoft Edge Add-ons receives the same Chromium build from the same source |
| [`extension/firefox/`](./extension/firefox/) | The runtime of the AMO-signed XPI | Mozilla Add-ons |
| [`extension/safari/`](./extension/safari/) | The WebExtension payload extracted from the signed Apple build | App Store (see [`SAFARI.md`](./SAFARI.md)) |

Each slot is replaced only after its provider handoff is verified, so browsers
can be on different versions. An Apple TestFlight upload alone does not publish
a Safari slot.

## Snapshot and release

[`snapshot.json`](./snapshot.json) records the browser version, provider state,
manifest hash, artifact and source hashes, source snapshot ID, source revision,
timestamp and publisher/audit tool versions. Its structure is defined in
[`security/snapshot.schema.json`](./security/snapshot.schema.json).
[`PRODUCT.json`](./PRODUCT.json) describes the product, its stores and its
browser slots.

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
action is withheld. Some merchant links are affiliate links; commissions do not
change which offers are eligible or how eligible offers are ordered.

Stan-authored browser material is available for inspection under
[`LICENSE`](./LICENSE). Third-party components remain under their own terms in
[`THIRD_PARTY_NOTICES.txt`](./THIRD_PARTY_NOTICES.txt).
