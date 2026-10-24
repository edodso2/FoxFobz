# Firmware — notes for Claude

Read [README.md](README.md) for the board table, build/flash commands and setup.

- Toolchain: NCS **v2.7.0** (Zephyr 3.6.99) at `~/ncs`, venv `~/ncs/venv`, SDK `~/zephyr-sdk`. Don't use newer-Zephyr APIs or docs without checking they exist in 3.6.
- Build with `firmware/scripts/build.sh receiver|fob`. A build passing is the minimum gate for any firmware change; flashing/on-car behavior is the user's call to verify.
- Boards today are **dev boards** (MDBT50Q-DB-40, MDBT42T-DB via `nrf52dk/nrf52805` + overlay). Custom PCB pinouts come from the KiCad schematic in `hardware/`, not from `hardware/receiver/docs/early-pin-plan.md` (stale).
- On-air values (command bytes, UUIDs, fob packet) live **only** in `common/include/foxfobz/protocol.h`. Never redefine them in an app. If you change one, also update `docs/protocol/ble-protocol.md` and `app/lib/constants/ble_constants.dart`.
- The receiver drives door motors: never fire both lock drivers + trunk at once (~19 A exceeds the 15 A fuse/D1 — see `hardware/receiver/TODO.MD`).
- Version: bump the app's `VERSION` file; tags are `receiver-fw/vX.Y.Z` / `fob-fw/vX.Y.Z` (the user tags releases).
