# App Architecture

## System Context

This Flutter app is one component of a larger BLE key fob system. The full system has three hardware nodes:

```
[Physical Key Fob]  ---BLE---> [nRF52840 Receiver] ---> [Relay / GPIO Output]
                                      ^
                                      |
                              [This Flutter App]
                              (iOS — BLE Central)
```

The **receiver** (nRF52840) is the hub. It accepts BLE Write commands from the phone and BLE Notify commands from the physical fob. Both the app and the physical fob independently control the same outputs (LEDs in POC, car door relays in production).

The app has no knowledge of the physical fob — it communicates only with the receiver.

---

## App Role

- **BLE role:** Central (initiates connection, writes commands)
- **Receiver role:** Peripheral (advertises, accepts writes)
- **Platform:** iOS only (POC scope)
- **No backend** — all communication is local BLE, no cloud, no internet required

---

## BLE Communication Model

```
App                          Receiver
 |                               |
 |-- scan for Command Service -->|
 |<-- advertisement ------------|
 |-- connect ------------------>|
 |-- (Phase 3: bond via LESC) ->|
 |                               |
 |-- Write 0x01 (unlock) ------->|-- trigger output
 |<-- Write response (success) --|
 |                               |
 |-- Write 0x02 (lock) --------->|-- trigger output
 |<-- Write response (success) --|
```

All writes use `writeWithResponse: true`. The app waits for the write response before updating UI state. See [ble-protocol.md](ble-protocol.md) for UUIDs and payload spec.

---

## State Management

Uses **flutter_hooks + Riverpod** via `HookConsumerWidget`. See [FLUTTER_BEST_PRACTICES.md](FLUTTER_BEST_PRACTICES.md) for the full decision guide and patterns.

| Concern | Tool |
|---|---|
| BLE connection state (shared, async) | Riverpod `StreamProvider` / `NotifierProvider` |
| Write-in-progress flag (local UI) | `useState` (flutter_hooks) |
| Scan results (short-lived, async) | Riverpod `FutureProvider` |
| Local widget animations / focus | flutter_hooks |

---

## Project Structure

```
lib/
  constants/
    ble_constants.dart     # ALL BLE UUIDs and payload bytes live here — never inline
  providers/
    ble_provider.dart      # Riverpod providers: connection state, scan, write
  services/
    ble_service.dart       # flutter_blue_plus wrapper — scan, connect, write
  screens/
    home_screen.dart       # Lock / Unlock buttons + connection status
    settings_screen.dart   # Pairing / device management (Phase 3)
  widgets/
    command_button.dart    # Reusable lock/unlock button widget
```

> Structure grows with the roadmap. Only add directories when a second file of that type exists.

---

## iOS Platform Requirements

- `NSBluetoothAlwaysUsageDescription` must be present in `ios/Runner/Info.plist`
- BLE Central usage requires no special entitlements beyond the plist key
- Background BLE reconnection (Phase 3) requires the `bluetooth-central` background mode in `Info.plist`

---

## Security Model (Phase 3+)

The app is **not the owner** of the receiver — it is just another paired device. No device has a privileged role.

- Pairing requires **any 2 currently paired fobs** to confirm (long-press within 30s window)
- Bonds use **LE Secure Connections (LESC)** — ECDH-based, MITM-protected
- All writes are authenticated — the receiver rejects writes from unbonded centrals
- Phase 3 adds **per-command challenge-response**: receiver issues a nonce, app must sign it with its bonded device key before the command is executed

The app cannot bypass or override this — authorization is enforced on the receiver firmware.

---

## What This App Does NOT Do

- Monitor fob button presses (that is receiver-internal logic)
- Manage firmware updates (future phase, not in current scope)
- Communicate with any cloud backend
- Support Android (POC scope is iOS only)
