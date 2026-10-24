# Compliance (US / FCC)

Goal: the minimum needed to sell legally in the US. Both boards use FCC pre-certified Raytac modules ([decision 0001](../decisions/0001-raytac-precertified-modules.md)), so no intentional-radiator certification is needed.

| Requirement | Details | Est. cost |
|---|---|---|
| FCC modular approval (receiver) | Covered by the **MDBT50Q-1MV2** FCC ID | $0 |
| FCC modular approval (fob) | Covered by the **MDBT42TV-PAT** FCC ID ([decision 0003](../decisions/0003-mdbt42t-fob.md)) | $0 |
| Part 15 Subpart B testing (unintentional radiator) | Required for both boards, at an accredited lab | $300–$1,500 |
| SDoC documentation | Self-declared, kept internally | $0–$500 (consultant optional) |
| FCC ID labeling | "Contains FCC ID: …" for each module, on the enclosure or silkscreen | Minimal |
| **Total estimated** | | **~$500–$2,000** |

## Key rules

- Don't modify the RF module or add an external antenna. Follow each module's antenna keep-out on all copper layers.
- Show the module FCC ID on the outside of the enclosure if the module isn't visible.
- Keep the SDoC package: test reports, user manual, FCC ID references.

Timing: after field testing passes (M6 in the [roadmap](../roadmap.md)), on the final board revision.
