# Fox Fobz — notes for Claude

BLE key fob + receiver for keyless locking on classic cars (first target: 1988 Mustang). Solo founder project spanning hardware, firmware, app and web in **one monorepo**. Read [README.md](README.md) for the repo map and versioning scheme.

## Start every session by reading
1. [STATUS.md](STATUS.md): what's in flight, what's blocked, known issues.
2. The `CLAUDE.md` of the area you're working in ([firmware/](firmware/CLAUDE.md), [hardware/](hardware/CLAUDE.md), [app/](app/CLAUDE.md), [web/](web/CLAUDE.md)).

## Current focus
Get a receiver + fob that **pass field testing** (milestone M5 in [docs/roadmap.md](docs/roadmap.md)). Car testing on the dev rig → order receiver revA → order fob revA → multi-car / multi-environment testing. LLC, Stripe, site completion and marketing are deferred. Don't pull them into scope unless asked.

Workstreams run **in parallel** (JLC lead times, parts pre-orders, garage time). Don't assume a sequential phase order.

## Ground rules
- **Single sources of truth:**
  - On-air protocol: `firmware/common/include/foxfobz/protocol.h` (mirrored in `app/lib/constants/ble_constants.dart`, spec in `docs/protocol/ble-protocol.md`; change all three together)
  - Board pinouts: KiCad schematics
  - Decisions: `docs/decisions/`
  - Status: `STATUS.md`
- When a decision changes, add an ADR in `docs/decisions/`. Don't rewrite old ADRs; add a new one that supersedes them.
- **Versioning:** per-component version files + prefixed tags (`receiver-hw/revA`, `receiver-fw/v0.2.0`, `fob-fw/…`, `fob-hw/…`, `protocol/vN`, `app/…`, `web/…`). Bump version files as part of changes when it fits. **Creating tags, pushing and deploying are the user's call.**
- Record tested hw/fw/app combinations in `docs/compatibility.md`, and test sessions in `testing/vehicle/` using the template.
- Keep `STATUS.md` current when you finish or unblock something.
- Never commit build outputs, KiCad backups/caches, `fab_outputs/`, `.dev.vars` or secrets.
