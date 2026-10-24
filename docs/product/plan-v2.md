> **Reference, not a schedule.** This is the original v2 plan. Superseded where the [decision log](../decisions/) says so, notably the fob module ([ADR 0003](../decisions/0003-mdbt42t-fob.md)) and the fob transport ([ADR 0004](../decisions/0004-fob-broadcast-not-connection.md)). Current milestones: [roadmap](../roadmap.md). Live state: [STATUS.md](../../STATUS.md).

# BLE Key Fob — POC Plan

## Overview

A Bluetooth Low Energy key fob system with an MVP of a custom iOS app, a custom key fob, and a custom receiver that can lock and unlock car doors. Both the fob and receiver are based on the Nordic nRF52840 (Raytac MDBT50Q-1MV2). The fob sends a BLE notification on button press; the receiver acts on it. The app allows direct lock/unlock control. Both boards share the same Nordic ecosystem, nRF Connect SDK (NCS), and Zephyr RTOS.

Built across six phases: starting with a phone + single dev board proof of concept, adding the fob board, hardening the app and firmware, then moving to custom PCBs with 12V car door control, and finally compliance.

---

## Why BLE Over RF

Traditional RF is simpler and has better range through metal, but it's one-way and dumb — you press, it triggers, that's all it can do. BLE gives you a two-way connection with full smartphone integration, built-in AES-128 encryption, and a single radio that works globally. For a product with a companion app, multi-fob management, and a path to OTA updates, BLE is the only choice that makes sense.
Features Enabled by BLE

- Battery monitoring — fob reports live battery % to the app, with low battery push notifications
- Button press history — timestamped activity log showing who triggered what and when
- Time-based access schedules — only allow triggering during set hours or days
- Multi-fob support with named profiles — "John's fob," "Jane's fob," with per-fob activity tracking
- Multiple buttons — each button triggers a different relay output, just like lock/unlock/trunk on a real car fob
- RSSI proximity / auto-unlock — ~~receiver triggers automatically as fob approaches, no button press needed~~ should not do this due to relay attack that broke Tesla's phone-as-a-key because the car is constantly listening and auto-unlocks so a signal can broadcast millions of codes at once and unlock the car
- Configurable relay timing — set pulse duration from the app, saved to flash
- NFC tap to pair — tap phone to fob to instantly open and connect the app
- Double-tap / long-press gestures — multiple commands from a single button
- OTA firmware updates — push firmware updates to fob and receiver wirelessly via the app
- Tamper alerts — app notified if relay triggers without an authorized fob in range
- Cloud sync — phone bridges BLE to backend for remote monitoring, logs, and fleet management

---

## Architecture

```
[nRF52840 Fob] ---BLE---> [nRF52840 Receiver] ---> [Relay / GPIO Output]
                    ^
                    |
              [Mobile App]
              (iOS / Android)
```

---

## Hardware Summary

| Board | Module | Chip | DigiKey Price |
|---|---|---|---|
| Fob | Raytac MDBT50Q-1MV2 | Nordic nRF52840 | $6.15 |
| Receiver | Raytac MDBT50Q-1MV2 | Nordic nRF52840 | $6.15 |

Both modules are pre-certified: FCC / IC / CE / Telec / KC / SRRC / NCC / WPC. Both use the same nRF Connect SDK (NCS) / Zephyr RTOS, the same BLE APIs, and the same coding patterns.

**The product ships pre-paired.** The receiver and both fobs are bonded at the factory before the box is sealed. The end user never performs an initial pairing ceremony. Adding a new device (phone app, replacement fob) requires any 2 currently paired fobs to physically confirm the request.

---

## Phase 1 — Mobile App + Single Dev Board (LED POC)

**Goal:** Validate end-to-end BLE communication using only a phone and one Raytac dev board. The receiver reads BLE Write commands from a minimal Flutter app and drives colored LEDs on a breadboard. Firmware is example-based, not production code.

**Key deliverables:** Flutter iOS app with Lock/Unlock buttons, minimal BLE Peripheral firmware on receiver, green/red LEDs wired to breadboard.

**Success:** Tapping Lock/Unlock in the app toggles the correct LED within 500ms, reliable at 10m.

→ [Full Phase 1 details](phases/phase-1-mobile-app-single-board.md)

---

## Phase 2 — FOB Board + Dual-Role Receiver

**Goal:** Add a second Raytac dev board as the physical key fob. By end of Phase 2, both the Flutter app and the physical fob button independently control the same LEDs via the receiver.

**Key deliverables:** Fob firmware (BLE Peripheral, button notification), receiver updated to run Central + Peripheral roles concurrently.

**Success:** Fob button press and app both trigger the correct LED independently; BLE reliable at 10m for both roles.

→ [Full Phase 2 details](phases/phase-2-fob-board-dual-role-receiver.md)

---

## Phase 3 — App Finalization

**Goal:** Harden the Flutter app. Lock/unlock is the only scope. Focus areas: LESC bonding, per-command AES-128 challenge-response, dual-fob pairing authorization flow, polished UI, automated tests, and reliable BLE reconnection.

**Key deliverables:** Fully bonded app with MITM-protected pairing, dual-fob authorization UI, auto-reconnect, widget/unit/integration tests.

**Success:** App bonds securely, pairing requires any 2 fobs to confirm, all automated tests pass.

→ [Full Phase 3 details](phases/phase-3-app-finalization.md)

---

## Phase 4 — Firmware Finalization

**Goal:** Replace minimal Phase 1/2 firmware with production-ready firmware on both boards. Deep sleep, reconnection logic, button debouncing, challenge-response auth, factory provisioning via SWD, and MCUboot firmware signing.

**Key deliverables:** Fob deep sleep < 5µA, dual-fob authorization state machine on receiver, per-command AES-128 challenge-response, MCUboot + ECDSA signing, SWD-injected factory bond data, APPROTECT enabled post-provisioning.

**Success:** All security and reliability criteria met; fob current < 5µA; BLE reconnects within 3s; paired list survives power cycle.

→ [Full Phase 4 details](phases/phase-4-firmware-finalization.md)

---

## Phase 5 — Custom PCB Design (KiCad)

**Goal:** Design production-ready PCBs for the fob and receiver. The receiver routes 12V to car door lock/unlock actuators via MOSFETs. Both boards include fuses and proper protection circuits.

**Key deliverables:** Fob PCB (CR2032, 1–2 buttons, status LED, SWD pads, ≤35×25mm), receiver PCB (12V input, buck converter, MOSFET outputs, TVS/reverse-polarity protection, SWD pads), DRC clean, sent to JLCPCB/PCBWay.

**Success:** Boards ordered, assembled, and 12V car door output validated.

→ [Full Phase 5 details](phases/phase-5-custom-pcb-design.md)

---

## Phase 6 — Compliance

**Goal:** Meet minimum FCC requirements to legally sell in the US. Both boards use the pre-certified Raytac module, so only Part 15 Subpart B (unintentional radiator) testing and SDoC documentation remain.

**Estimated cost:** ~$500–$2,000 total.

→ [Full Phase 6 details](phases/phase-6-compliance.md)

---

## POC Milestone Summary

| Phase | Milestone | Est. Time |
|---|---|---|
| 1 | Flutter app + single dev board: lock/unlock LEDs working end-to-end | 1–2 weeks |
| 2 | FOB board added: both physical fob and app independently control LEDs | 1–2 weeks |
| 3 | App finalized: security, BLE bonding, automated tests passing | 2–3 weeks |
| 4 | Firmware finalized: deep sleep, reconnect, auth hardened, < 5µA confirmed | 2–3 weeks |
| 5 | KiCad PCBs designed, ordered, and assembled (12V car door output) | 3–5 weeks |
| 6 | Part 15B testing complete, SDoC filed | 2–4 weeks (lab scheduling) |

**Total MVP to sellable product: ~3–4 months**

---

## Open Questions / Decisions

- [x] How many buttons on the fob? 2
- [x] Desired enclosure for fob? off-the-shelf key fob
- [x] Volume estimate for first production run? 50
- [x] **Security — fob identity tokens:** Per-command AES-128 challenge-response using nRF52840 hardware crypto. Receiver issues random nonce per command; device must return `AES128(device_key, nonce)`. Device key derived from BLE LTK at bond time — unique per device. Prevents replay attacks and commands from cloned or unbonded devices.
- [x] **Pairing mode:** Dual-fob root of trust. Product ships pre-paired (factory bonded). Adding or revoking any device requires **any 2 currently paired fobs** to long-press within a 30-second window — no privileged app owner role. This means a user with 3+ fobs can lose one and still authorize new pairings or revoke the lost fob using any 2 remaining fobs. RMA required only when fewer than 2 fobs remain. External pairing button only signals readiness; it does not grant authorization. Factory reset is internal only (not accessible from outside sealed enclosure). Max paired devices configurable (default 4).
- [x] **Lost-fob recovery / RMA:** Customer ships back receiver + remaining fob(s). Manufacturer reads FICR.DEVICEID, issues ERASEALL via J-Link, reflashes firmware, injects new bond data via SWD, reseals APPROTECT. No remote re-provisioning path exists. Intentionally requires return to manufacturer — same model as a car dealership.
- [x] **Pre-pairing production workflow:** SWD-injected bond data via pogo-pin provisioning jig. No BLE pairing ceremony during manufacturing — bond records written directly to flash via `nrfjprog`. Provisioning data signed by manufacturer ECDSA key (private key in USB HSM). FICR.DEVICEID logged in manufacturing database for every unit.
- [ ] **Silicon revision check:** Verify nRF52840 build code on received MDBT50Q-1MV2 modules (read `NRF_FICR->INFO.VARIANT`). Rev 2 (DXX) has a published voltage-glitching APPROTECT bypass; Rev 3 (Fx0) has hardened protection. Document which revision ships in production units and include in product threat model.
- [ ] **Provisioning jig design:** 3D-printed pogo-pin fixture contacting SWD test pads on all three boards simultaneously. Scripted via `nrfjprog` + manufacturer signing tool. Decide whether to build in-house or contract to a board programmer service.
