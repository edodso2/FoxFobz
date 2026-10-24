> **Note:** the fob now uses the MDBT42TV-PAT ([ADR 0003](../../decisions/0003-mdbt42t-fob.md)), so the fob row below should reference the MDBT42T FCC ID, not the MDBT50Q.

# Phase 6 — Compliance

**Goal:** Meet minimum FCC requirements to legally sell in the US.

| Requirement | Details | Est. Cost |
|---|---|---|
| FCC modular approval (fob) | Covered by Raytac MDBT50Q-1MV2 FCC pre-certification | $0 |
| FCC modular approval (receiver) | Covered by Raytac MDBT50Q-1MV2 FCC pre-certification | $0 |
| Part 15 Subpart B testing (unintentional radiator) | Required for both boards — test at accredited lab | $300–$1,500 |
| SDoC documentation | Self-declared, maintain internally | $0–$500 (consultant optional) |
| FCC ID labeling | Print on enclosure/PCB silkscreen referencing Raytac FCC IDs | Minimal |
| **Total estimated** | | **~$500–$2,000** |

## Key Rules

- Do not modify the RF module or add an external antenna
- Display module FCC ID on outside of enclosure if module is not visible
- Maintain SDoC documentation package (test reports, manual, FCC ID references)
