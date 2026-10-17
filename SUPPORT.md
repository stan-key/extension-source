# Stan Support

Stan compares the Steam price you are viewing with verified, compatible Steam
key offers, right on supported Steam game pages and wishlists. It works in
Chrome, Microsoft Edge, Firefox and Safari on iPhone, iPad and Mac.

**Need a hand?** Write to **contact@stan-key.com**.

## Install Stan

| Browser | Where to install | Good to know |
| --- | --- | --- |
| Google Chrome | [Chrome Web Store](https://chromewebstore.google.com/detail/ehhomikpbeokopccgmienllpnambnkif) | Desktop Chrome on Mac, Windows and Linux. |
| Microsoft Edge | [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/mifpmbmnhmjgdmagibinlgmigbabmaml) | Same Chromium build as Chrome, from the same source. |
| Mozilla Firefox | [Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/stan-steam-price-comparison/) | The AMO-signed package. |
| Safari | [App Store](https://apps.apple.com/app/stan-steam-price-checker/id6803592430) | iPhone, iPad and Mac. Turn Stan on in Safari's extension settings after installing. |

Official stores keep Stan up to date automatically. Store availability can vary
by country or region.

### Chrome from an iPhone or iPad

If you open the Chrome Web Store listing in Safari or another mobile browser,
Google may show **Add to desktop** (or **Ajouter au bureau** in French). Tap it
and Google installs the extension in desktop Chrome on a computer signed in to
the same Google account. Stan runs in desktop Chrome, not in Chrome on iPhone or
iPad. If the button is not available, open the listing on your computer and
choose **Add to Chrome**.

### Turn Stan on in Safari

- **iPhone or iPad:** Settings → Apps → Safari → Extensions → Stan.
- **Mac:** Safari → Settings → Extensions.

Turn on Stan, then allow it on the Steam website when Safari asks.

### Mainland China / 简体中文

The [Simplified Chinese installation guide](./INSTALL.zh-CN.md) lists the
official stores and an optional manual installation path for Chrome. For
package, permission and data-flow checks, see the
[auditable engineering stack](./AUDITABLE_STACK.md) and
[audit guide](./AUDIT_GUIDE.md).

## If Stan does not show a comparison

1. Wait for the Steam purchase area to finish loading.
2. Check that Stan is enabled and allowed on `store.steampowered.com`.
3. Reload the game page once.

Stan also stays quiet on purpose when it cannot prove the game edition,
package, activation region, availability or displayed price. Coverage is
partial, so the absence of an offer does not mean that no offer exists
elsewhere.

## Inspect or install a package yourself

The [latest GitHub Release](https://github.com/stan-key/extension-source/releases/latest)
exposes the exact Chrome ZIP, the AMO-signed Firefox XPI and the Safari
WebExtension payload, each with a `.sha256` file.

1. Download the asset for your browser and its `.sha256` file.
2. Compare the checksum with that browser's entry in [`snapshot.json`](./snapshot.json).
3. Run [`./tools/audit-release`](./AUDIT_GUIDE.md) to check the asset against
   the source, manifest, permissions and data contracts.
4. Read the matching source: [`extension/chrome/`](./extension/chrome/),
   [`extension/firefox/`](./extension/firefox/) or
   [`extension/safari/`](./extension/safari/).

Chrome manual installation is an advanced path: download the Chrome ZIP,
verify it, extract it, open `chrome://extensions`, enable **Developer mode**,
choose **Load unpacked** and select the extracted directory. A manually loaded
extension does not update automatically.

The Safari ZIP is for inspection only; install Stan for Safari from the App
Store.

## When you write to us

Include your browser and operating-system versions, the Stan version and, if
relevant, the Steam game page. Please remove personal information from
screenshots, and never send a password, payment details, recovery code or
private account link.

## Privacy, legal and transparency

- [Privacy](https://stan-key.com/privacy)
- [Legal notice](https://stan-key.com/legal)
- [Transparency notes](./TRANSPARENCY.md)
- [Product metadata](./PRODUCT.json)
- [Security](./SECURITY.md): for a security question or report, contact
  **contact@stan-key.com**.

Stan is an independent product. Valve and Steam are trademarks of Valve
Corporation. Stan is not provided, endorsed or supported by Valve.
