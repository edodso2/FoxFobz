# 0007 — Receiver: 4-layer board, DRV8873H (hardware-config) drivers

**Context.** The receiver started as a 2-layer design (KiCad repo `main`). It was converted to 4 layers on the `4-layer-experiment` branch, which is the version the JLC order notes describe. The early pin plan assumed SPI-configured DRV8873S drivers.

**Decision.**
- 4 layers: 2 oz outer and 1 oz inner copper, In1 GND plane, In2 VM plane, ~87.7 × 52 mm.
- Two **DRV8873H** drivers set up by hardware pins (MODE/SR/nITRIP/nOL to GND, nSLEEP on GPIO, IPROPI 470 Ω to the ADC). No SPI bus.

**Consequences.**
- The early pre-schematic pin plan (SPI bus on P0.13–P0.17) is superseded and was dropped from this repo; it's still in the archived planning repo. The schematic is the pinout source of truth.
- The 2-layer variant only exists in the old KiCad repo's `main` branch history.
- *Main driver for going to 4 layers (routing closure vs current/thermal planes) wasn't written down. Add it.*
