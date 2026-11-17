# Stan for Safari

Stan for Safari works on iPhone, iPad and Mac.
[Download it on the App Store](https://apps.apple.com/app/stan-steam-price-checker/id6803592430),
then turn it on in Safari's extension settings:

- **iPhone or iPad:** Settings → Apps → Safari → Extensions → Stan.
- **Mac:** Safari → Settings → Extensions.

Store availability can vary by country or region.

## What the Safari slot contains

The `extension/safari/` slot contains the WebExtension payload extracted from
the signed Apple build after the provider handoff is verified. It is the code
Safari loads on supported Steam pages, published here for inspection.

The Safari ZIP in the Release is that browser payload, not a standalone
installer, and the native Apple app that delivers it is not part of this
repository.

The Safari slot is updated only after the matching iOS or macOS submission is
confirmed. Its `snapshot.json` entry records the provider state, version and
SHA-256 so reviewers can match the inspected payload to the current release.
