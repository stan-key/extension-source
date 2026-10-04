# Security policy

Security is part of how Stan is built, not an afterthought: narrow
permissions, a single API origin, no remote code and a public audit for every
store package. If you find something that looks wrong, we want to hear about
it.

## Contact

Write to **contact@stan-key.com**. Please include:

- the affected browser slot and version;
- its artifact SHA-256 from [`snapshot.json`](./snapshot.json);
- your browser and operating-system versions;
- the affected page or feature, and the steps to reproduce it.

## Scope

This repository covers the public browser-side slots under
[`extension/chrome/`](./extension/chrome/) (also distributed through Microsoft
Edge Add-ons), [`extension/firefox/`](./extension/firefox/) and
[`extension/safari/`](./extension/safari/), their declared permissions, data
and network contracts, and their correspondence with provider artifacts.

In scope, for example:

- unexpected permissions, data access or network destinations;
- remote executable code or unsafe DOM behavior;
- unsafe redirect or link handling;
- a mismatch between a store package and its published source.

## Check it yourself

Run [`./tools/audit-release`](./AUDIT_GUIDE.md) to check a provider slot, and
read [`THREAT_MODEL.md`](./THREAT_MODEL.md) for the documented residual risks
and their mitigations.
