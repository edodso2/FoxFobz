# 0008 — Monorepo with per-component tags

**Context.** Work had spread across ~8 folders and repos (planning, 2 firmware, app, website, business, KiCad), with duplicated and drifting protocol constants, roadmaps and flashing docs. Workstreams now run in parallel.

**Decision.**
- One private repo, created 2026-10-23 as a fresh copy (old repos archived as history).
- Each component is versioned on its own via a version file plus prefixed annotated tags: `receiver-hw/revA`, `fob-hw/revA`, `receiver-fw/vX.Y.Z`, `fob-fw/vX.Y.Z`, `protocol/vN`, `app/vX.Y.Z`, `web/vX.Y.Z`.
- Tested combinations are recorded in [compatibility.md](../compatibility.md).

**Consequences.**
- Shared protocol header, one CLAUDE.md root, one place to look.
- Cloudflare Workers Builds must use root directory `web/` (watch path `web/**`).
- History before 2026-10-23 lives in the archived repos.
