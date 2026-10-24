# Fob board

KiCad project goes here (`FoxFobz_Fob.kicad_pro`). Create it in this folder with project-local libraries (`${KIPRJMOD}`), the same way as [../receiver/](../receiver/).

Requirements: [phase 5: fob board requirements](../../docs/product/phases/phase-5-custom-pcb-design.md#fob-board-requirements). Note the module is the **MDBT42TV-PAT** ([ADR 0003](../../docs/decisions/0003-mdbt42t-fob.md)), not the MDBT50Q listed there.

Key constraints: CR2032, 2 buttons (+2 reserved), status LED, SWD pads at 2.54 mm pitch for the pogo jig, ≤ 35×25 mm, off-the-shelf enclosure. Button pins used by the firmware today: P0.04 unlock, P0.05 lock, P0.12 / P0.14 reserved ([overlay](../../firmware/fob/boards/nrf52dk_nrf52805.overlay)).
