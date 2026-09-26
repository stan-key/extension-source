# Stan's auditable engineering stack

Stan publishes its browser packages, corresponding source trees and the
machine-readable contracts for permissions, network access and browser-side
data. The release is organized so reviewers can compare distributed bytes
with the published source and evidence.

## Install from official stores

- [Chrome Web Store](https://chromewebstore.google.com/detail/ehhomikpbeokopccgmienllpnambnkif)
- [Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/stan-steam-price-comparison/)
- [Current release and inspection packages](https://github.com/stan-key/extension-source/releases/latest)

Official store listings are the standard installation and update channels.
The GitHub Release exposes the current provider packages and checksums for
independent inspection.

## Release evidence

[`snapshot.json`](./snapshot.json) records each provider package's version,
artifact SHA-256, source-tree SHA-256, manifest SHA-256 and provider handoff
metadata. Chrome, Firefox and Safari remain separate slots because their
provider packages and release states differ.

Run the dependency-free audit with Node.js 20 or later:

```sh
./tools/audit-release all
```

The audit compares the published `main` branch and `latest` tag, the snapshot,
Release assets, checksum sidecars, package contents and source slots. It also
checks manifests against the permission contract and checks the network,
data-flow and page-bridge contracts. Reports use explicit `PASS`, `FAIL` and
`NOT_CHECKED` states; a missing asset or failed download cannot pass silently.
See [`AUDIT_GUIDE.md`](./AUDIT_GUIDE.md) for the exact procedure and limits.

GitHub Actions repeats the snapshot audit after updates to `main` and runs the
live Release audit when a Release is published or edited. Both the workflow
definition and its run results are available in the public repository.

## Narrow permissions and bounded data

The manifests and [`security/permissions.json`](./security/permissions.json)
make declared access reviewable per provider. Chrome and Firefox request
`storage` and the documented Stan API host. Safari also declares Steam host
access for its content scripts. None requests `<all_urls>`, cookies, browsing
history, `tabs` or `webRequest`.

[`security/data-contract.json`](./security/data-contract.json) lists the data
read, sent and stored for each flow. The wishlist bridge projects a small,
typed set of fields; isolated extension code validates those fields against
the visible Steam row. The bridge itself has no network, cookie, storage or
extension API access. Requests omit credentials, reject redirects, time out
and cap response size. Executable code ships in the package and is not loaded
remotely.

## Review boundaries

The audit verifies that bytes and metadata match the published hashes and
contracts. A matching SHA-256 proves byte equality, not who created the bytes
or how they were built. The audit checks Firefox's signature-file inventory;
it does not independently validate the cryptographic signature. Provider
review and signing evidence remain identified separately in `snapshot.json`.

Stan-authored files are available for inspection under the terms in
[`LICENSE`](./LICENSE). Third-party components and their terms are listed in
[`THIRD_PARTY_NOTICES.txt`](./THIRD_PARTY_NOTICES.txt).

## Audit references

- [Fast and deep audit steps](./AUDIT_GUIDE.md)
- [Security architecture](./SECURITY_ARCHITECTURE.md)
- [Data-flow inventory](./DATA_FLOW.md)
- [Permissions contract](./security/permissions.json)
- [Network allowlist](./security/network-allowlist.json)
- [Browser-side data contract](./security/data-contract.json)
- [Wishlist bridge schema](./security/main-world-schema.json)
- [Threat model](./THREAT_MODEL.md)
- [Security reporting](./SECURITY.md)
