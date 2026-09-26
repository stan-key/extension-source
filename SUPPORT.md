# Stan Support

Stan is a browser extension for Chrome, Firefox and Safari that compares the Steam price you are viewing with verified, compatible Steam key offers on supported Steam pages and wishlists.

## Install or inspect

### Mainland China / 简体中文

Open the [Simplified Chinese installation guide](./INSTALL.zh-CN.md) for direct links to the official Chrome and Firefox stores, plus the optional Chrome manual-install steps. For package, permission and data-flow checks, see the [auditable engineering stack](./AUDITABLE_STACK.md) and [audit guide](./AUDIT_GUIDE.md).

### Chrome Web Store

Use the [official Chrome Web Store listing](https://chromewebstore.google.com/detail/ehhomikpbeokopccgmienllpnambnkif). The [latest GitHub Release](https://github.com/stan-key/extension-source/releases/latest) also exposes the exact checksummed Chrome ZIP for direct inspection or advanced unpacked installation.

If you open the listing on an iPhone or iPad in Safari or another mobile browser, Google may show **Add to desktop** (or **Ajouter au bureau** in French). Tap it and Google automatically installs the extension in desktop Chrome on a Mac, Windows or Linux computer signed in to the same Google account. Stan runs in desktop Chrome, not in Chrome on iPhone or iPad. If the button is not available, open the listing on the destination computer and choose **Add to Chrome**.

### Firefox and Safari provider assets

Install Firefox from the [official Mozilla Add-ons listing](https://addons.mozilla.org/firefox/addon/stan-steam-price-comparison/). The latest Release also exposes its signed provider package for inspection.

The latest Release exposes `stan-firefox-<version>.xpi` after its AMO `listed` signature handoff and `stan-safari-webextension-<version>.zip` after App Store Review submission. `snapshot.json` identifies the exact version and SHA-256 for each slot.

The Safari ZIP is the browser WebExtension payload extracted from the signed Apple build for inspection.

## Verify a provider asset

1. Open the [latest Release](https://github.com/stan-key/extension-source/releases/latest).
2. Select the asset for the browser you are reviewing and its matching `.sha256` file.
3. Compare the checksum with the corresponding browser entry in [`snapshot.json`](./snapshot.json).
4. Run [`./tools/audit-release`](./AUDIT_GUIDE.md) to check the Release asset against the source slot, manifest, permissions and data contracts.
5. Inspect the matching source directory: [`extension/chrome/`](./extension/chrome/), [`extension/firefox/`](./extension/firefox/) or [`extension/safari/`](./extension/safari/).

Chrome manual installation is an advanced path: download the Chrome ZIP, verify it, extract it, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the extracted directory.

## If Stan does not show a comparison

Stan intentionally stays quiet when it cannot establish a reliable comparison for the game edition, package, market, availability or displayed price. Coverage is partial and non-exhaustive, so the absence of an offer does not mean that no offer exists elsewhere.

## Privacy, transparency and source inspection

- Privacy: https://stan-key.com/privacy
- Legal notice: https://stan-key.com/legal
- Contact: contact@stan-key.com
- Browser-source snapshot: ./extension/
- Snapshot fingerprint: ./snapshot.json
- Product metadata: ./PRODUCT.json
- Transparency notes: ./TRANSPARENCY.md
- GitHub Release: https://github.com/stan-key/extension-source/releases/latest

## Security issues

For security questions or reports, contact **contact@stan-key.com** as described in [SECURITY.md](./SECURITY.md).

## Valve / Steam

Stan is an independent product. Valve and Steam are trademarks of Valve Corporation. Stan is not provided, endorsed or supported by Valve.
