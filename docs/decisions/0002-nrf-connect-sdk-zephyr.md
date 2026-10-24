# 0002 — nRF Connect SDK / Zephyr instead of Adafruit/Arduino

**Context.** Early firmware used the Adafruit/Arduino nRF52 stack. Planning commit `ec25fa4` ("Replace adafruit with zephyr", ~2026-03-08) switched to NCS.

**Decision.** Both apps use nRF Connect SDK v2.7.0 (Zephyr 3.6.99), built with `west`.

**Consequences.**
- One toolchain and one set of BLE APIs for both SoCs, plus a path to MCUboot signing and production features.
- Toolchain pinned at NCS v2.7.0. Upgrade deliberately and record it here.
- *Original rationale beyond the above wasn't written down. Add it if it matters.*
