# 0003 — Fob uses MDBT42TV-PAT (nRF52805), not MDBT50Q

**Context.** The v2 plan used the MDBT50Q-1MV2 (nRF52840) on both boards. The fob needs to be small (≤ 35×25 mm), run on a CR2032, and only send a few commands.

**Decision.** Per plan v3: MDBT42TV-PAT (nRF52805), which is low power and compact, on the fob; MDBT50Q-1MV2, which is high power, on the receiver. Dev board: MDBT42T-DB, built as `nrf52dk/nrf52805` + overlay.

**Consequences.**
- The fob is no longer covered by the MDBT50Q FCC ID. Label it with the MDBT42T's FCC ID ([compliance](../production/compliance.md)). v3 estimated ~200 ft working range.
- nRF52805 is small (192 KB flash / 24 KB RAM; the fob uses ~76% RAM today). Keep the fob firmware lean.
- Supersedes the v2 plan's nRF52840-on-both-boards design.
