# Phase 1 — Mobile App + Single Dev Board (LED POC)

**Goal:** Validate end-to-end BLE communication using only a phone and one Raytac dev board before investing in additional hardware. The receiver board reads BLE Write commands from the Flutter app and drives colored LEDs on a breadboard. Phase 1 firmware is minimal — example-based, not production code.

## What You Need

| Component | Part | Source | Price (approx) |
|---|---|---|---|
| nRF52840 receiver dev board | Raytac MDBT50Q-DB-40 | Amazon | $17.50 |
| J-Link programmer | nRF52840-DK (PCA10056) | Nordic / Mouser | ~$50 |
| Green LED | Any 5mm or 3mm LED | Any | < $0.50 |
| Red LED | Any 5mm or 3mm LED | Any | < $0.50 |
| 220Ω resistors (x2) | 1/4W through-hole | Any | < $0.25 |
| Breadboard + jumper wires | Standard | Any | — |
| iOS device (iPhone) | Already owned | — | — |

## Phase 1 Firmware (Minimal — Example-Based)

Start from Zephyr's `bluetooth/peripheral` sample (in NCS). No production firmware needed.

**Receiver** — ~10–20 lines of changes from the example:
- Advertise a Command Service UUID so the Flutter app can discover it
- On BLE Write received → check payload byte:
  - `0x01` (unlock) → green LED HIGH for 3 seconds, then LOW
  - `0x02` (lock) → red LED HIGH for 3 seconds, then LOW
- Wire green LED to one GPIO, red LED to another, both with 220Ω resistors to GND

## Phase 1 App (Minimal Flutter)

- **Framework:** Flutter (iOS target only for now)
- **BLE library:** `flutter_blue_plus`
- Scan for receiver by Command Service UUID and connect
- Two buttons: **Lock** and **Unlock**
  - Unlock → Write `0x01` to Command Characteristic
  - Lock → Write `0x02` to Command Characteristic
- Display connection status: disconnected / connected

## Tasks

- [ ] Set up nRF Connect SDK (west + Zephyr) for receiver board
- [ ] Wire green and red LEDs to receiver dev board GPIO via breadboard
- [ ] Flash minimal BLE Peripheral firmware to receiver (Command Service UUID, LED GPIO control)
- [ ] Create Flutter iOS app with `flutter_blue_plus`, Lock and Unlock buttons
- [ ] Add BLE Central scan + Write logic to app
- [ ] Add BLE usage declaration to `Info.plist`
- [ ] Confirm app discovers and connects to receiver
- [ ] Confirm Unlock → green LED on for 3 seconds
- [ ] Confirm Lock → red LED on for 3 seconds

## Success Criteria

- Tapping Unlock in the app turns the green LED on for 3 seconds within 500ms
- Tapping Lock in the app turns the red LED on for 3 seconds within 500ms
- BLE connection reliable at 10m distance
