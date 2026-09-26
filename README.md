# Stan browser extension transparency

Stan compares the Steam purchase context already visible on a supported game
page with selected Steam key offers. This repository is the **public source
snapshot for the current browser release**, with the browser packages and
checks needed to inspect them.

## Install Stan

- [Install Stan from the official Chrome Web Store](https://chromewebstore.google.com/detail/ehhomikpbeokopccgmienllpnambnkif)
- [Install Stan from Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/stan-steam-price-comparison/)
- [简体中文安装指南](./INSTALL.zh-CN.md)

The browser stores are the recommended installation and update path. The
Chinese guide also explains how to inspect and manually load the current
Chrome package when the store is unavailable.

Start with the fast audit:

```sh
./tools/audit-release chrome
```

It needs Node.js 20 or later and an internet connection to read the public
GitHub Release. It has no package dependencies. Use `all` to check all three
browser slots, or add `--json` for machine-readable output. The audit is
fail-closed when a required check cannot be completed. See
[`AUDIT_GUIDE.md`](./AUDIT_GUIDE.md) for the exact checks and their limits.

## What is published

`extension/chrome/`, `extension/firefox/` and `extension/safari/` contain the
browser payloads derived from the corresponding provider artifacts. The slots
can have different provider versions. [`snapshot.json`](./snapshot.json) records
each current slot's version, provider state, artifact and source SHA-256,
manifest hash, source snapshot identifier, source revision and provenance.

The public repository is a view of the current browser release, not a release
archive. It deliberately keeps one root commit: `main` and the `latest` tag
must identify the same commit. Each provider update composes a fresh root
snapshot containing only the current Chrome, Firefox and Safari slots.

## Browser access in the current production packages

The audit reads each checked-in manifest and compares it with
[`security/permissions.json`](./security/permissions.json). The current
provider packages declare:

| Browser | Extension permission | Host permissions | Content-script pages |
| --- | --- | --- | --- |
| Chrome | `storage` | `https://api.stan-key.com/*` | Steam game pages and wishlists |
| Firefox | `storage` | `https://api.stan-key.com/*` | Steam game pages and wishlists |
| Safari | `storage` | `https://api.stan-key.com/*`, `https://store.steampowered.com/*` | Steam game pages and wishlists |

Safari declares Steam host access in its provider manifest. The actual code
matches only the listed Steam routes; inspect its slot and
[`SAFARI.md`](./SAFARI.md) for this partial-public boundary. None of the three
packages declares `<all_urls>`, `cookies`, `history`, `tabs` or `webRequest`.
Chrome and Firefox use a small wishlist bridge in the page's `MAIN` world;
Safari's provider slot is checked independently.

Extension API requests go only to `https://api.stan-key.com`. Links to the
official browser store and Stan's website are user-navigation links, not
additional API destinations. The extension fetch wrapper omits credentials,
rejects redirects, times out requests and bounds JSON responses. It does not
load remote executable code.

## Browser-side data

On a Steam game page, the isolated extension reads the displayed game/package,
price, currency, market and language context needed to request a comparison.
On a wishlist, the `MAIN` bridge projects only the loaded item's app/package
IDs, displayed final price, formatted price and bundle flags; the isolated
extension checks those values against the row shown in Steam. The bridge does
not read cookies or account tokens, call the network, use extension storage or
call extension APIs.

Category preferences use browser sync storage when available and fall back to
local extension storage if sync is absent or unusable. A random installation
identifier is stored locally. It is pseudonymous and persists until browser
storage is cleared or the extension is removed. A short-lived session token is
kept in session storage where available, otherwise in memory; it expires
within six hours. These details and the separately handled website analytics
are itemized in [`DATA_FLOW.md`](./DATA_FLOW.md) and
[`security/data-contract.json`](./security/data-contract.json).

## What the audit checks

The audit checks the current browser package against its source slot, manifest,
permissions, network and data contracts, release assets and provider evidence.
SHA-256 confirms that checked bytes match the recorded digest; it does not
identify who created those bytes or how they were built. Review each current
provider release and its store listing before updating.

Stan-authored files are distributed under the terms in [`LICENSE`](./LICENSE).
Those terms allow inspection and security research but do not grant general
redistribution or derivative-product rights. Third-party components remain
under their own terms in [`THIRD_PARTY_NOTICES.txt`](./THIRD_PARTY_NOTICES.txt).

## More detail

- [Fast audit and deep-audit steps](./AUDIT_GUIDE.md)
- [Data-flow inventory](./DATA_FLOW.md)
- [Security architecture](./SECURITY_ARCHITECTURE.md)
- [Threat model and residual risks](./THREAT_MODEL.md)
- [Permissions contract](./security/permissions.json)
- [Network allowlist](./security/network-allowlist.json)
- [Data contract](./security/data-contract.json)
- [Wishlist bridge schema](./security/main-world-schema.json)
- [Security reporting](./SECURITY.md)
- [Simplified Chinese guide for mainland China](./README.zh-CN.md)
- [Manual installation guide (Simplified Chinese)](./INSTALL.zh-CN.md)
- [Auditable engineering stack and release evidence](./AUDITABLE_STACK.md)
- [Support](./SUPPORT.md)

Stan is independent of Valve Corporation. Steam and Valve are trademarks of
Valve Corporation. Stan is not provided, endorsed or supported by Valve.
