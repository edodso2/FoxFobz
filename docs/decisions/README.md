# Decision log

One short file per decision that shaped the product (`NNNN-title.md`): **Context → Decision → Consequences**. Add a new file rather than rewriting an old one; mark superseded ones. Where the original reasoning wasn't written down, the ADR says so. Fill it in when you can.

| # | Decision | Status |
|---|---|---|
| [0001](0001-raytac-precertified-modules.md) | Raytac FCC pre-certified modules on both boards | Accepted |
| [0002](0002-nrf-connect-sdk-zephyr.md) | nRF Connect SDK / Zephyr instead of Adafruit/Arduino | Accepted |
| [0003](0003-mdbt42t-fob.md) | Fob uses MDBT42TV-PAT (nRF52805), not MDBT50Q | Accepted (supersedes v2 plan) |
| [0004](0004-fob-broadcast-not-connection.md) | Fob sends non-connectable broadcasts | Accepted (auth pending) |
| [0005](0005-no-proximity-auto-unlock.md) | No RSSI proximity auto-unlock | Accepted |
| [0006](0006-preprovisioned-dual-fob-authorization.md) | Ship pre-paired; adding/removing devices needs 2 fobs | Accepted |
| [0007](0007-receiver-4-layer-drv8873h.md) | Receiver: 4-layer board, DRV8873H (hardware-config) drivers | Accepted |
| [0008](0008-monorepo-component-tags.md) | Monorepo with per-component tags | Accepted |
