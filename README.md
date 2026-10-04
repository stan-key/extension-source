<div align="center">

<a href="https://stan-key.com/">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/brand/stan-lockup-dark.svg">
    <img src="./assets/brand/stan-lockup-light.svg" alt="Stan" width="240">
  </picture>
</a>

### Steam prices. Right where you need them.

Stan compares the price you see on Steam with verified, compatible Steam key
offers, right on supported game pages and wishlists.<br>
No account. No extra tab. A comparison only when it is proven.

<br>

<a href="https://chromewebstore.google.com/detail/ehhomikpbeokopccgmienllpnambnkif"><img src="./assets/badges/chrome-web-store.png" alt="Available in the Chrome Web Store" height="58"></a>&nbsp;
<a href="https://microsoftedge.microsoft.com/addons/detail/mifpmbmnhmjgdmagibinlgmigbabmaml"><img src="./assets/badges/microsoft-edge-add-ons.svg" alt="Get it from Microsoft Edge Add-ons" height="58"></a>&nbsp;
<a href="https://addons.mozilla.org/firefox/addon/stan-steam-price-comparison/"><img src="./assets/badges/firefox-add-ons.svg" alt="Get the add-on for Firefox" height="58"></a>&nbsp;
<a href="https://apps.apple.com/app/stan-steam-price-checker/id6803592430"><img src="./assets/badges/app-store.svg" alt="Download on the App Store" height="58"></a>

<br>

[Website](https://stan-key.com/) ·
[Privacy](https://stan-key.com/privacy) ·
[Verify a release](./AUDIT_GUIDE.md) ·
[Support](./SUPPORT.md) ·
[简体中文](./README.zh-CN.md)

</div>

---

## Private by design.

The code that runs in your browser is published in this repository. Here is
what it promises, and where to check each promise yourself.

**No account.**
Use Stan without signing up or signing in. Nothing you do is tied to a name,
an email address or a profile.

**Only Steam pages.**
Stan runs on Steam game pages and wishlists, and nowhere else. It never asks
for `<all_urls>`, `history`, `tabs`, `cookies` or `webRequest`.
[See the permissions](./security/permissions.json)

**Nothing private is read.**
Your Steam password, access tokens, checkout fields and payment details are
never read. Stan reads the game, edition and price that Steam already shows
you. [See the data flow](./DATA_FLOW.md)

**One destination.**
The extension talks to a single origin, `https://api.stan-key.com`, without
cookies or credentials, and refuses redirects.
[See the network allowlist](./security/network-allowlist.json)

**No remote code.**
Everything that runs ships inside the store-reviewed package. Manifest V3, no
`eval`, no remote scripts. [See the architecture](./SECURITY_ARCHITECTURE.md)

**Quiet when unsure.**
If the edition, activation region, availability, price or freshness of an
offer cannot be proven, Stan shows nothing at all rather than a guess.

## Install in seconds

Install Stan from your browser's official store. Stores review each version and
keep Stan up to date automatically.

| Browser | Official store | Code you can inspect here |
| --- | --- | --- |
| Google Chrome | [Install Stan from the official Chrome Web Store](https://chromewebstore.google.com/detail/ehhomikpbeokopccgmienllpnambnkif) | [`extension/chrome/`](./extension/chrome/) |
| Microsoft Edge | [Get Stan from Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/mifpmbmnhmjgdmagibinlgmigbabmaml) | Same Chromium build as Chrome, from the same source: [`extension/chrome/`](./extension/chrome/) |
| Mozilla Firefox | [Install Stan from Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/stan-steam-price-comparison/) | [`extension/firefox/`](./extension/firefox/) |
| Safari on iPhone, iPad and Mac | [Download Stan on the App Store](https://apps.apple.com/app/stan-steam-price-checker/id6803592430) | [`extension/safari/`](./extension/safari/) |

Store availability can vary by country or region. In mainland China, the
[简体中文安装指南](./INSTALL.zh-CN.md) lists the official stores and a verified
manual installation path for Chrome:
[Manual installation guide (Simplified Chinese)](./INSTALL.zh-CN.md).

## Don't take our word for it. Verify it.

One command checks that the package a store distributes matches the code in
this repository, byte for byte:

```sh
./tools/audit-release chrome
```

It needs Node.js 20 or later, has no dependencies and reads the public GitHub
Release. Use `firefox`, `safari` or `all` to check another browser, and add
`--json` for a machine-readable report. Each check reports `PASS`, `FAIL` or
`NOT_CHECKED`; a check that cannot run is never reported as a pass. The
[audit guide](./AUDIT_GUIDE.md) explains every step.

### Current release

| Browser | Version | Package | SHA-256 |
| --- | --- | --- | --- |
| Chrome and Edge | `2.0.1` | `stan-chrome-2.0.1.zip` | `ead9eaa04d1fd5f87f54e3ddacf228cc50f12e8af8a152ec9d1e74d117fae594` |
| Firefox | `2.0.1` | `stan-firefox-2.0.1.xpi` | `e0db8023f235bbd78e9251f25705aa8df69bb853be80873d232a2ea98e60115a` |
| Safari | `1.9.0` | `stan-safari-webextension-1.9.0.zip` | `1ae51b1e7b7072cb3c7ee7c5b7f6b3e5b36435cad2f2b63220b9cb1112cec9d0` |

Packages and checksum files are attached to the
[latest GitHub Release](https://github.com/stan-key/extension-source/releases/latest).
[`snapshot.json`](./snapshot.json) records the same values with each
provider's handoff state and provenance.

## Exactly what Stan can access

The audit compares each published manifest with
[`security/permissions.json`](./security/permissions.json).

| Browser | Extension permission | Host permissions | Runs on |
| --- | --- | --- | --- |
| Chrome and Edge | `storage` | `https://api.stan-key.com/*` | Steam game pages and wishlists |
| Firefox | `storage` | `https://api.stan-key.com/*` | Steam game pages and wishlists |
| Safari | `storage` | `https://api.stan-key.com/*`, `https://store.steampowered.com/*` | Steam game pages and wishlists |

Safari declares Steam host access in its provider manifest; its code still
matches only the listed Steam routes ([`SAFARI.md`](./SAFARI.md)). None of the
packages declares `<all_urls>`, `cookies`, `history`, `tabs` or `webRequest`.
On Chrome, Edge and Firefox, a small wishlist bridge runs in the page's `MAIN`
world and emits six bounded fields, described in
[`security/main-world-schema.json`](./security/main-world-schema.json).

Extension requests go only to `https://api.stan-key.com`. Links to official
stores and to Stan's website are navigation you choose, not API destinations.
The fetch wrapper omits credentials, rejects redirects, times out after five
seconds and caps responses at 128 KiB.

## What Stan reads, sends and keeps

| | What happens |
| --- | --- |
| **Reads** | On a Steam game page: the displayed game and package, price, currency, market and page language. On a wishlist: each loaded row's app and package IDs, final price and bundle flags, checked against the row Steam shows. |
| **Sends** | The bounded comparison request (App ID, Package ID, displayed price, currency, market handle) to `https://api.stan-key.com`. |
| **Keeps** | Your category preferences (browser sync storage when available), a random installation identifier until you clear storage or remove Stan, and a session token that expires within six hours. |
| **Never touches** | Browsing history, cookies, Steam credentials, checkout fields, payment details and unrelated form content. |

Every flow is itemized in [`DATA_FLOW.md`](./DATA_FLOW.md) and, field by field,
in [`security/data-contract.json`](./security/data-contract.json). Website
analytics and campaign measurement happen on the website, not in the
extension; they are described on [Stan's privacy page](https://stan-key.com/privacy).

## How this repository works

`extension/chrome/`, `extension/firefox/` and `extension/safari/` contain the
browser payloads extracted from the packages each store received. Browsers can
be on different versions.

This repository always shows the current release. It keeps a single root
commit: `main` and the `latest` tag identify the same commit, and each store
update publishes a fresh snapshot. Keep a local copy of any version you want
to compare later.

## Honest about limits

- SHA-256 proves that bytes match a recorded digest. It does not say who built
  them; store review, the AMO signature and Apple signing are the provider's
  evidence.
- A passing audit describes the files and metadata observed at audit time.
  Review each new store version before you update.
- Coverage is partial: when Stan shows nothing, an offer may still exist
  elsewhere.

The [threat model](./THREAT_MODEL.md) lists each residual risk and its
mitigation.

## Explore further

| Document | What you will find |
| --- | --- |
| [Audit guide](./AUDIT_GUIDE.md) | The fast audit, the deep audit and every report field |
| [Auditable engineering stack](./AUDITABLE_STACK.md) | Release evidence, contracts and check states |
| [Data flow](./DATA_FLOW.md) | Each flow: what is read, sent, stored and why |
| [Security architecture](./SECURITY_ARCHITECTURE.md) | Execution contexts and how they are isolated |
| [Threat model](./THREAT_MODEL.md) | Risks, mitigations and what remains |
| [Transparency](./TRANSPARENCY.md) | Provenance, store slots and what a passing audit proves |
| [Security](./SECURITY.md) | How to report a security issue |
| [Support](./SUPPORT.md) | Installation help and answers |
| [简体中文说明](./README.zh-CN.md) | Simplified Chinese overview |

## License and trademarks

Stan-authored files are available under the terms in [`LICENSE`](./LICENSE),
which allow inspection, audit and good-faith security research but do not grant
general redistribution or derivative-product rights. Third-party components
remain under their own terms in
[`THIRD_PARTY_NOTICES.txt`](./THIRD_PARTY_NOTICES.txt).

Stan is independent of Valve Corporation. Steam and Valve are trademarks of
Valve Corporation. Chrome is a trademark of Google LLC, Microsoft Edge of
Microsoft Corporation, Firefox of the Mozilla Foundation, and Safari and App
Store of Apple Inc. Stan is not provided, endorsed or supported by Valve.
