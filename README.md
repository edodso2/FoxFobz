# Fox Fobz

A BLE key fob + receiver that adds keyless lock/unlock to classic cars, starting with the 1988 Fox-body Mustang. A Raytac MDBT50Q (nRF52840) receiver sits in the OEM door-lock circuit and drives the lock motors through DRV8873 H-bridges, so the OEM switches keep working. A Raytac MDBT42T (nRF52805) fob and an iOS app send lock/unlock commands to it.

```
[Fob: MDBT42T]  --BLE broadcast-->  [Receiver: MDBT50Q]  -->  DRV8873 ×2  -->  door lock motors
                                          ^       ^
                         [iOS app] --GATT-+       +-- OEM lock switches (sensed)
```

**Where things stand:** [STATUS.md](STATUS.md) · **Milestones:** [docs/roadmap.md](docs/roadmap.md)

## Repo map

| Folder | What | Version source | Tag prefix |
|---|---|---|---|
| [hardware/receiver/](hardware/receiver/) | Receiver PCB (KiCad 10, 4-layer) | KiCad title block Rev | `receiver-hw/revX` |
| [hardware/fob/](hardware/fob/) | Fob PCB (not started) | KiCad title block Rev | `fob-hw/revX` |
| [hardware/dev-rig/](hardware/dev-rig/) | Breadboard rig for car testing | — | — |
| [firmware/receiver/](firmware/receiver/) | Receiver firmware (NCS 2.7 / Zephyr) | `VERSION` | `receiver-fw/vX.Y.Z` |
| [firmware/fob/](firmware/fob/) | Fob firmware | `VERSION` | `fob-fw/vX.Y.Z` |
| [firmware/common/](firmware/common/) | Shared protocol header | `FOB_PROTO_VERSION` | `protocol/vN` |
| [app/](app/) | iOS app (Flutter) | `pubspec.yaml` version | `app/vX.Y.Z` |
| [web/](web/) | foxfobz.com (Astro + Cloudflare Workers + Stripe) | `package.json` version | `web/vX.Y.Z` |
| [testing/](testing/) | Bench tests, per-vehicle field-test logs, templates | — | — |
| [docs/](docs/) | Roadmap, security, protocol, decisions, backlog, production, datasheets | — | — |
| [business/](business/) | Project brief (shareable overview), business plan, LLC setup, operations | — | — |

## Versioning

Every component evolves and is versioned on its own, in this one repo:

- **Tags are prefixed per component** and annotated (`git tag -a fob-fw/v0.2.0 -m "…"`). List one component's history with `git tag -l 'fob-fw/*'`, or `git log receiver-fw/v0.1.0..receiver-fw/v0.2.0 -- firmware/receiver`.
- **Hardware** gets a letter revision only when boards are ordered. The exact fab files are committed in `hardware/<board>/releases/revX/` ([process](hardware/README.md#revisions-and-releases)).
- **Firmware** uses semver (0.x until field testing passes). Tag when a build goes on a car or ships. Each board prints its version and `git describe` build id at boot.
- **Protocol** changes that break on-air compatibility bump `FOB_PROTO_VERSION` and get a `protocol/vN` tag.
- **[docs/compatibility.md](docs/compatibility.md)** records which hw rev × fw × app combinations were tested together. That's the record for sign-off.

## Quick start

```bash
firmware/scripts/build.sh receiver && firmware/scripts/flash.sh receiver
firmware/scripts/build.sh fob && firmware/scripts/flash.sh fob
cd app && flutter run
cd web && npm ci && npm run dev
```

Open `FoxFobz.code-workspace` in VS Code for per-folder tooling (nRF Connect, Flutter, Astro).

## History

This repo was created on 2026-10-23 as a fresh copy consolidating these archived repos and folders: `~/Documents/FoxFobz` (planning), `~/Development/foxfobz-dev/*` (firmware, app, website, business), and `~/Documents/ki-cad/FoxFobz_Reciever` (`4-layer-experiment` @ `4ef8637`). See their git history for anything earlier.
