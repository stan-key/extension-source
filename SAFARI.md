# Safari package

The `extension/safari/` slot contains the WebExtension payload extracted from
the signed Apple build after the provider handoff is verified. It is available
for inspecting the files loaded by Safari on supported Steam pages.

This ZIP is the browser payload, not a standalone Safari installer. To install
Stan for Safari, use the current Apple distribution path listed on
[Stan's website](https://stan-key.com/).

The Safari slot is updated only after the matching iOS or macOS submission is
confirmed. Its `snapshot.json` entry records the provider state, version and
SHA-256 so reviewers can match the inspected payload to the current release.
