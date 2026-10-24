# App Roadmap

## Current Status

**Phase 1 — in progress.** Flutter project scaffolded. No features implemented yet.

---

## App Phases

The overall project has 6 phases. Only 2 of them involve this Flutter app:

| Phase | App Involvement | Status |
|---|---|---|
| Phase 1 | **Minimal app** — scan, connect, lock/unlock buttons, connection status | In progress |
| Phase 2 | No app changes — firmware-only work (adding physical fob board) | Not started |
| Phase 3 | **App finalization** — LESC bonding, pairing flow, auto-reconnect, tests, polished UI | Not started |
| Phase 4 | No app changes — firmware hardening | Not started |
| Phase 5 | No app changes — PCB design | Not started |
| Phase 6 | No app changes — compliance | Not started |

---

## Phase 1 — Minimal App (Active)

**Goal:** Prove end-to-end BLE communication with a single dev board. Minimal code. Controlling LEDs on the receiver is the only success criterion.

**Spec:** [phase-1-app.md](phase-1-app.md)

### Checklist

- [ ] Add `flutter_blue_plus`, `riverpod`, `flutter_hooks`, `hooks_riverpod` to pubspec
- [ ] Add `NSBluetoothAlwaysUsageDescription` to `ios/Runner/Info.plist`
- [ ] Define UUIDs and payload bytes in `lib/constants/ble_constants.dart`
- [ ] Implement BLE scan — filter by Command Service UUID
- [ ] Implement connect / disconnect
- [ ] Implement Write `0x01` (unlock) to Command Characteristic
- [ ] Implement Write `0x02` (lock) to Command Characteristic
- [ ] Display connection status: disconnected / connected
- [ ] Confirm unlock triggers green LED on dev board within 500ms at 10m
- [ ] Confirm lock triggers red LED on dev board within 500ms at 10m

**Done when:** App reliably controls LEDs on the dev board receiver.

---

## Phase 3 — App Finalization

**Goal:** Harden the app for real-world use. Security, reliability, polished UI, and automated tests. No new features beyond what Phase 1 established.

**Spec:** [phase-3-app.md](phase-3-app.md)

### Checklist

- [ ] LESC bonding (Numeric Comparison, MITM protection)
- [ ] Pairing flow: "Pair with Receiver" screen with dual-fob authorization UI
- [ ] Add Device / Remove Device flows in settings
- [ ] Per-command challenge-response (coordinate with Phase 4 firmware)
- [ ] Auto-reconnect when receiver comes back in range
- [ ] Write failure handling with user feedback
- [ ] Polished lock/unlock UI (sending / success / error states)
- [ ] Widget tests for button states
- [ ] Unit tests for BLE command encoding
- [ ] Integration tests with BLE mock layer

**Done when:** All tests pass, bonding is LESC, pairing requires dual-fob confirmation.

---

## Future (Not Current POC Scope)

These are planned for the full product but out of scope for the current phases:

- Android support
- OTA firmware updates
- Activity log / button press history
- Per-fob battery monitoring
- Time-based access schedules
- Multiple relay outputs / buttons
