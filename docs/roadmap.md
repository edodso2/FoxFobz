# Roadmap

Milestones are **deliverables**, not a sequence. Workstreams run in parallel. JLC lead times, parts pre-orders and garage time mean several are always in flight. Live state is in [STATUS.md](../STATUS.md).

The original phase-by-phase plan is kept in [product/plan-v2.md](product/plan-v2.md) and [product/phases/](product/phases/). Those are now **topic references**: requirements, security model, PCB requirements, compliance. They are not a schedule.

## Workstreams

| Workstream | Lives in | Reference spec |
|---|---|---|
| Car testing (dev rig) | `hardware/dev-rig/`, `testing/` | [bench tests](../testing/bench/mustang-1988-bench-tests.md) |
| Receiver HW | `hardware/receiver/` | [phase 5](product/phases/phase-5-custom-pcb-design.md) |
| Fob HW | `hardware/fob/` | [phase 5](product/phases/phase-5-custom-pcb-design.md) |
| Receiver FW | `firmware/receiver/` | [phase 2](product/phases/phase-2-fob-board-dual-role-receiver.md), [phase 4](product/phases/phase-4-firmware-finalization.md) |
| Fob FW | `firmware/fob/` | [phase 4](product/phases/phase-4-firmware-finalization.md) |
| App | `app/` | [app roadmap](../app/docs/ROADMAP.md), [phase 3](product/phases/phase-3-app-finalization.md) |
| Web | `web/` | [web README](../web/README.md) |
| Business | `business/` | deferred |

## Milestones

### M1 — Car test passes on the dev rig
Breadboard + DRV8873 breakouts + MDBT50Q-DB-40 on the car. App and fob (MDBT42T-DB) both lock and unlock both doors, and the OEM switches keep working.
- Depends on: Car testing, Receiver FW, Fob FW, App (phase-1 level)
- Exit: logged in `testing/vehicle/` and tagged `receiver-fw/v0.x` / `fob-fw/v0.x`; any receiver schematic changes it reveals are in `hardware/receiver/`

### M2 — Receiver revA ordered
- Depends on: M1 findings folded in, the `hardware/receiver/TODO.MD` pre-order checks done, parts pre-ordered (U1, F1)
- Exit: fab snapshot in `hardware/receiver/releases/revA/`, tag `receiver-hw/revA`

### M3 — Fob revA ordered
- Depends on: Fob HW design, fob FW validated on MDBT42T-DB
- Exit: `hardware/fob/releases/revA/`, tag `fob-hw/revA`

### M4 — revA bring-up
Both custom boards run firmware: power, SWD flashing, BLE, motor drive, current sense.
- Depends on: M2, M3; custom Zephyr board definitions in `firmware/boards/`
- Exit: bring-up log per board in `testing/bench/`; issues filed as revB candidates

### M5 — Field test passes ⟵ *current product goal*
Receiver and fob pass testing on multiple cars in multiple environments.
- Depends on: M4 (or revB)
- Draft exit criteria (to confirm):
  - [ ] ≥ N cars / model years, logged with [the test-log template](../testing/templates/test-log.md)
  - [ ] Environments: garage, open lot, parked near other BLE/RF sources, hot (in-cabin summer), cold, rain
  - [ ] Range target met (v3 estimate ~200 ft) with fob in pocket and in hand
  - [ ] Zero missed or phantom commands across the test window; OEM switches still work
  - [ ] No driver faults or thermal issues on repeated cycling; fuse and diode within rating
  - [ ] Fob battery life projection is acceptable (target < 5 µA sleep)
  - [ ] Every passing combination recorded in [compatibility.md](compatibility.md)

### M6 — Launch prep (deferred)
LLC, Stripe/site completion, compliance (FCC Part 15B / SDoC, see [production/](production/)), production provisioning, marketing. Not planned until M5 passes.
