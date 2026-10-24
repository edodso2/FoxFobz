# 0001 — Raytac FCC pre-certified modules on both boards

**Context.** Bare nRF52 SoCs are bottom-pad packages that are hard to assemble. They would also need intentional-radiator RF certification, which costs thousands.

**Decision.** Use Raytac modules with castellated pads and a built-in antenna, pre-certified FCC/IC/CE/etc.: MDBT50Q-1MV2 in the receiver and MDBT42TV-PAT in the fob (see [0003](0003-mdbt42t-fob.md)).

**Consequences.**
- Compliance shrinks to Part 15B (unintentional radiator) + SDoC + labeling with the module FCC IDs. See [production/](../production/).
- Antenna keep-out on all layers per the Raytac datasheet. Raytac will review layouts for free.
- Modules are consigned to JLC (pre-ordered).
- See [production notes](../production/nrf52840-production-notes.md) and [compliance](../production/compliance.md).
