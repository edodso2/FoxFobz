# 0003 — Fob uses MDBT42TV-PAT (nRF52805), not MDBT50Q

**Context.** The v2 plan used the MDBT50Q-1MV2 (nRF52840) on both boards. The fob needs to be small (≤ 35×25 mm), run on a CR2032, and only send a few commands.

**Decision.** Per [plan v3](../product/plan-v3-draft.md): MDBT42TV-PAT (nRF52805), which is low power and compact, on the fob; MDBT50Q-1MV2, which is high power, on the receiver. Dev board: MDBT42T-DB, built as `nrf52dk/nrf52805` + overlay.

**Consequences.**
- The fob is no longer covered by the MDBT50Q FCC ID. Label it with the MDBT42T's FCC ID ([phase 6](../product/phases/phase-6-compliance.md) still says MDBT50Q for both and needs updating).
- nRF52805 is small (192 KB flash / 24 KB RAM; the fob uses ~76% RAM today). Keep the fob firmware lean.
- Older docs that assume nRF52840 on the fob ([plan v2](../product/plan-v2.md), phases 2/4/5) are superseded on this point.
