# Phase 1 — Minimal App Build Spec

## Goal

Validate end-to-end BLE communication between the iOS app and a single nRF52840 dev board. The receiver firmware drives LEDs on a breadboard. The app only needs to scan, connect, and write lock/unlock commands.

No security, no bonding, no polish. Get the BLE write working and the LEDs responding.

---

## Scope

**In scope:**
- BLE scan filtered by Command Service UUID
- Connect to receiver
- Lock button — writes `0x02` to Command Characteristic
- Unlock button — writes `0x01` to Command Characteristic
- Connection status indicator: disconnected / connected

**Out of scope (Phase 3):**
- BLE bonding or pairing
- Auto-reconnect
- Settings screen
- Any animation or polished UI
- Automated tests

---

## Dependencies

Add to `pubspec.yaml`:

```yaml
dependencies:
  flutter_blue_plus: ^1.x
  riverpod: ^2.x
  hooks_riverpod: ^2.x
  flutter_hooks: ^0.20.x
```

---

## iOS Setup

`ios/Runner/Info.plist` must include:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app uses Bluetooth to connect to your key fob receiver.</string>
```

---

## BLE Constants

All UUIDs and payload bytes live in `lib/constants/ble_constants.dart`. Never inline them.

See [ble-protocol.md](ble-protocol.md) for the full protocol spec and UUID values.

---

## App Behavior

### Scan

- On app launch, begin scanning for BLE peripherals advertising the Command Service UUID
- Stop scan once the receiver is found and connected
- Display "Searching..." while scanning

### Connect

- Connect to the first peripheral found advertising the Command Service UUID
- Discover services and characteristics after connection
- Display "Connected" once the Command Characteristic is found and ready

### Lock / Unlock

- **Unlock button** → Write `0x01` to Command Characteristic with `writeWithResponse: true`
- **Lock button** → Write `0x02` to Command Characteristic with `writeWithResponse: true`
- Buttons are disabled while disconnected

### Disconnect

- If the connection drops, display "Disconnected" and re-enable scanning
- No auto-reconnect in Phase 1 — user restarts the scan manually

---

## State (Riverpod)

```
bleConnectionStateProvider   — StreamProvider: disconnected / connecting / connected
bleCommandProvider           — NotifierProvider: exposes lock() and unlock() methods
```

BLE scanning and the device reference are managed inside `BleService` and exposed via providers. Widgets do not call `flutter_blue_plus` directly.

---

## Screen Layout

Single screen (`HomeScreen`):

```
[ Status: Connected ]

      [ UNLOCK ]

      [ LOCK   ]
```

Buttons are full-width, clearly labeled. No other UI needed in Phase 1.

---

## Success Criteria

- Tapping Unlock → green LED on dev board turns on for 3 seconds within 500ms
- Tapping Lock → red LED on dev board turns on for 3 seconds within 500ms
- BLE connection holds reliably at 10m
- App shows correct connection status at all times
