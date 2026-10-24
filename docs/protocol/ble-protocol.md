# BLE Protocol — App ↔ Receiver ↔ Fob

This document defines the BLE interfaces between the Flutter app (Central), the nRF52840 receiver (Peripheral + Observer) and the nRF52805 fob (Broadcaster).

**Source of truth for on-air values:** [`firmware/common/include/foxfobz/protocol.h`](../../firmware/common/include/foxfobz/protocol.h) — shared by both firmware apps. The app mirrors them in [`app/lib/constants/ble_constants.dart`](../../app/lib/constants/ble_constants.dart) (never hardcoded in UI or logic files). If this doc, the header and the Dart constants disagree, the header wins; fix the others in the same commit.

| Version | Tag | Change |
|---|---|---|
| Fob packet `0x01` | `protocol/v1` | Initial unauthenticated fob broadcast + 1-byte GATT command |

See [docs/compatibility.md](../compatibility.md) for which firmware/app versions speak which protocol.

---

## Overview

The app connects to the receiver as a BLE Central. The receiver advertises one service (Command Service) with one characteristic (Command Characteristic). The app discovers this service by UUID and writes lock/unlock commands to the characteristic.

---

## Phase 1 Protocol (No Auth)

### Command Service

| Field | Value |
|---|---|
| Service UUID | See `BleConstants.commandServiceUuid` |
| Advertised | Yes — receiver advertises this UUID so the app can discover it |

### Command Characteristic

| Field | Value |
|---|---|
| Characteristic UUID | See `BleConstants.commandCharacteristicUuid` |
| Properties | **Write with response** |
| Permissions | Write |
| Payload size | 1 byte |

### Payload Bytes

| Command | Byte | Receiver Action |
|---|---|---|
| Unlock | `0x01` | Both door motors run in the unlock direction (100 ms soft-start ramp + 1.5 s hold) |
| Lock | `0x02` | Both door motors run in the lock direction (same timing) |

### Write Flow

```
App                          Receiver
 |-- Write 0x01 ----------->|
 |<-- Write response --------|   (ATT Write Response — confirms delivery)
```

- Always use `writeWithResponse: true` — the app waits for the ATT Write Response before updating UI
- The receiver processes the command only after the write is confirmed

---

## Fob Broadcast Protocol (No Auth)

The hardware fob (MDBT42T / nRF52805, `firmware/fob/`) does **not** connect. On each button press it sends non-connectable advertisements for ~500ms (20–30ms interval), then goes quiet. The receiver passively scans the whole time, in parallel with advertising and serving the app's connection, and feeds matching packets into the same command handler as the app's GATT write. This does not affect the app.

### Packet

Sent as `ADV_NONCONN_IND` from the fob's static identity address, carrying one Manufacturer Specific Data AD structure (8 bytes):

| Offset | Size | Field | Value |
|---|---|---|---|
| 0 | 2 | Company ID (LE) | `0xFFFF` (Bluetooth SIG ID reserved for testing) |
| 2 | 2 | Magic | `'F' 'X'` (`0x46 0x58`) |
| 4 | 1 | Protocol version | `0x01` |
| 5 | 1 | Command | `0x01` unlock, `0x02` lock (same bytes as the app) |
| 6 | 2 | Press counter (LE) | Increments per press; resets when the fob reboots |

### Receiver Handling

- Packets that aren't `ADV_NONCONN_IND`, or don't match company ID, magic and version, are ignored
- De-duplication: a packet with the same fob address + press counter within 2s of the last accepted one is the same press and is dropped. The controller's duplicate filter is off because a fob reuses its address for every press
- No delivery confirmation: the fob can't know whether the receiver heard it. The ~500ms burst makes a miss unlikely at normal range

### Fob Buttons

| Button | Pin | Command |
|---|---|---|
| 1 | P0.04 | `0x01` unlock |
| 2 | P0.05 | `0x02` lock |
| 3 | P0.12 | Reserved |
| 4 | P0.14 | Reserved |

> **Security:** like the Phase 1 app protocol, this is unauthenticated and trivially replayable. A rolling counter plus an AES-CCM MAC (hardware-supported on the nRF52805) is the intended hardening path. The Phase 3 bonding scheme below applies to the app only.

---

## Phase 3 Protocol (Bonded + Challenge-Response)

Extends Phase 1. Requires Phase 4 firmware to be deployed on the receiver.

### Bonding

- Receiver requires LESC (LE Secure Connections) bonding before accepting Write commands
- Unbonded centrals are rejected at the ATT permission level
- Pairing mode: Numeric Comparison (MITM protected)

### Per-Command Challenge-Response

Each write command triggers a nonce exchange before the command is executed:

```
App                                    Receiver
 |-- Write command byte (0x01/0x02) -->|
 |<-- Notify: nonce (8 bytes) ---------|
 |-- Write: AES128(device_key, nonce)->|
 |<-- Write response (success/reject) -|
```

**Nonce Characteristic** (added in Phase 3):

| Field | Value |
|---|---|
| Characteristic UUID | See `BleConstants.nonceCharacteristicUuid` |
| Properties | Notify |

**Response Characteristic** (added in Phase 3):

| Field | Value |
|---|---|
| Characteristic UUID | See `BleConstants.responseCharacteristicUuid` |
| Properties | Write with response |
| Payload | 16 bytes — AES-128 output of `AES128(device_key, nonce)` |

- `device_key` is derived from the BLE LTK at bond time — unique per paired device
- A new nonce is issued for every command — no replay possible
- The receiver computes the expected response and rejects mismatches

> **Note:** Do not implement the challenge-response flow until Phase 4 firmware is ready. Phase 1 and Phase 2 use the simple single-byte write only.

---

## Scan Filter

The app scans for peripherals advertising the Command Service UUID. It does not connect to any device that is not advertising this UUID.

```dart
// In BleService — do not hardcode the UUID string here
FlutterBluePlus.scanResults
  .where((results) => results.any(
    (r) => r.advertisementData.serviceUuids
      .contains(BleConstants.commandServiceUuid)
  ));
```

---

## Error Cases

| Scenario | App Behavior |
|---|---|
| Write response indicates failure | Show error state on button, display brief message |
| Connection drops mid-write | Show error state, begin reconnect |
| Characteristic not found after connect | Log error, show "Device not supported" |
| Phase 3: nonce not received within timeout | Abort command, show error |
| Phase 3: receiver rejects AES response | Show "Command rejected" error |
