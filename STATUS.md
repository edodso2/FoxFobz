# Status

_Last updated: 2026-10-23_. Update this whenever a workstream changes state. Milestones: [docs/roadmap.md](docs/roadmap.md).

**Current goal:** finish car testing on the dev rig (M1), then order receiver revA (M2) and shortly after fob revA (M3), then field-test on multiple cars and environments until it passes (M5).

| Workstream | State | Waiting on / blocker | Next action | Latest version |
|---|---|---|---|---|
| Car testing (dev rig) | 🟡 In progress | Garage time | Run tests on the car, log with [template](testing/templates/test-log.md) | — |
| Receiver HW | 🟡 Designed, ready to order | M1 findings; pre-order U1 (C5118826) + F1 (C5249699) | Close [TODO.MD](hardware/receiver/TODO.MD) items (J2 rating, MDBT50Q ref circuit, LR8342A cap); order revA | revA (unreleased) |
| Fob HW | ⚪ Not started | — | Create KiCad project in `hardware/fob/` | — |
| Receiver FW | 🟡 POC: app + fob control both doors (soft-start PWM) | — | Use results from car testing | v0.1.0 |
| Fob FW | 🟡 POC broadcast on MDBT42T-DB | Test on MDBT42T-DB | Validate range; plan auth (rolling counter + AES-CCM, [ADR 0004](docs/decisions/0004-fob-broadcast-not-connection.md)) | v0.1.0 |
| App | 🟡 Phase-1 level (scan / connect / lock / unlock) | — | Phase 3 items when firmware auth lands | 1.0.0+1 |
| Web | 🟡 Scaffolded (Astro + CF Workers + Stripe) | Deferred to M6 | — | 1.0.0 |
| Business | ⚪ Docs only | Deferred to M6 | — | — |

## Known issues / to verify

Carried over from the consolidation (2026-10-23):

- [ ] **Receiver KiCad:** one 3D model uses an absolute path that no longer exists (`/Users/ericdodson/Development/easy_eda_converter/.../TO-277...wrl`), so it's missing in the 3D view.
- [ ] **Receiver KiCad:** 3D model paths mix `${KICAD9_3DMODEL_DIR}` and `${KICAD10_3DMODEL_DIR}`. Standardize on KICAD10.
- [ ] **Receiver KiCad:** `sym-lib-table` lacks entries for SL1545, 3568 and MDBT50Q-1MV2. It works only because the schematic carries cached copies.
- [ ] **Receiver KiCad:** no title block (Rev / date / title). Set Rev A before ordering ([process](hardware/README.md#revisions-and-releases)).
- [ ] **Receiver KiCad:** `BTS70081EPAXUMA1.pretty` is unused on this board.
- [ ] **Receiver FW:** never fire both lock drivers + trunk at once (~19 A > 15 A fuse/D1). Stagger outputs.
- [ ] **Security (open):** read `NRF_FICR->INFO.VARIANT` on received MDBT50Q (and MDBT42T) modules and record the silicon revision (Rev 2 has an APPROTECT glitch bypass). See [security.md](docs/security.md#firmware-integrity--decided).
- [ ] **Security (open):** fob authentication for broadcast packets (`protocol/v2`), needed before M5. See [security.md](docs/security.md#fob--receiver-broadcast--open).
- [ ] **Production (open):** provisioning jig design, in-house vs service; SWD header vs pogo pads on production boards.
- [ ] **ADRs:** missing rationale for 0002, 0004 and 0007.
