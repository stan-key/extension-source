# Browser extension audit guide

The standard path checks one provider slot in under five minutes on a normal
connection. Run it from the root of this repository with Node.js 20 or later:

```sh
./tools/audit-release chrome
```

Use `firefox`, `safari` or `all` to select another slot. Add `--json` to emit a
machine-readable report. `--snapshot-only` is useful in CI and offline review;
it does not verify the current GitHub Release or download its provider asset.
The tool reads the currently published v2 snapshot during migration and
validates the expanded v3 schema on the next snapshot publication.

## Fast audit

1. **Run the audit command.** Confirm the selected browser, version, expected
   and calculated artifact/source SHA-256 values, and final status. The report
   also prints the manifest version, permissions, host permissions, Steam page
   matches, `MAIN` scripts and fields, request bounds, and categorized data
   flows.
2. **Read the manifest.** Check the selected slot's manifest and compare its
   permissions, host permissions, content-script matches and `MAIN` scripts
   with [`security/permissions.json`](./security/permissions.json).
3. **Read the network contract.** Confirm the executable API destination is
   the allowlisted Stan API origin. Treat browser-store and website links as
   navigation only.
4. **Read the data contract.** Follow the source, browser storage, API fields,
   purpose and verified retention for each flow in
   [`security/data-contract.json`](./security/data-contract.json).
5. **Inspect the wishlist bridge.** Compare the emitted message against
   [`security/main-world-schema.json`](./security/main-world-schema.json).
   The bridge runs only in the page context for supported wishlist pages and
   has no network, cookie, storage or extension API access.
6. **Verify provenance.** The command compares the GitHub `main` branch and
   `latest` tag, the local single-root snapshot, snapshot metadata, exact
   current Release asset inventory, `.sha256` sidecar and extracted source
   slot. It recomputes the artifact, manifest and source SHA-256 values and
   checks the expected AMO signature-file inventory in the Firefox XPI.
7. **Read the threat model and browser notes.** Review the current risks in
   [`THREAT_MODEL.md`](./THREAT_MODEL.md), and check the provider listing for
   the version you plan to install.

## Deep audit

- Read all three manifests and compare the independent browser slots.
- Inspect the `src/` files named by each content-script entry and the service
  worker or background script.
- Trace external action URLs from their validation point through the rendered
  link. The browser client accepts only the documented Stan API origin for
  API-backed content.
- Review the `MAIN` world code and the bounded output schema. Do not treat
  page messages as trusted: the isolated script validates them against the
  visible Steam row.
- Compare the current source directory and manifest hashes with the slot in
  `snapshot.json`. This repository intentionally shows the latest release only
  and does not preserve prior release snapshots.
- Read [`THREAT_MODEL.md`](./THREAT_MODEL.md), [`SAFARI.md`](./SAFARI.md), the
  privacy policy and the third-party notices.
- The audit pins the reviewed snapshot schema, permissions, network, data-flow
  and bridge contracts by SHA-256. Changing one of those files without deliberately
  updating the audit tool's approved pin fails the check. This is a current
  release check; the repository does not preserve earlier snapshots.
- For a provider update, verify the downloaded asset directly and review the
  provider's own listing or signature. SHA-256 detects a byte mismatch; it
  does not identify the publisher or prove how an artifact was built. The fast
  audit checks the Firefox signature-file inventory, not the cryptographic
  validity of the signature.

## Report fields

The JSON report uses explicit `PASS`, `FAIL` and `NOT_CHECKED` states and
includes expected and calculated hashes. A failed
download or unavailable GitHub API is not reported as a pass. A passing report
means the checks described above matched the bytes and metadata observed at
audit time.
