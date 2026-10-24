# Phase 2 — FOB Board + Dual-Role Receiver

**Goal:** Add a second Raytac dev board as the physical key fob. By end of Phase 2, both the Flutter app and the physical fob button independently control the same LEDs on the breadboard via the receiver.

## What to Buy

| Component | Part | Source | Price (approx) |
|---|---|---|---|
| nRF52840 fob dev board | [Raytac MDBT50Q-DB-40](https://www.amazon.com/dp/B0B58CRVX1) | Amazon | $17.50 |
| Tactile button | Any 6mm THT | DigiKey | < $0.50 |

## Fob Firmware (Zephyr / NCS)

`prj.conf`:
```ini
CONFIG_BT=y
CONFIG_BT_PERIPHERAL=y
CONFIG_BT_DEVICE_NAME="FoxFobz Fob"
```

Build: `west build -b raytac_mdbt50q_db_40/nrf52840 .`

**Key behaviors:**
- Wake on button press (GPIO interrupt)
- Advertise and connect to receiver, send BLE notification
- Payload: 1 byte (`0x01` = unlock, `0x02` = lock)
- ~10–20 lines of changes from the Phase 1 receiver example

## Receiver Firmware (updated from Phase 1)

The receiver is updated to run **dual BLE roles simultaneously**: Central (scanning for fob) + Peripheral (advertising command service to app). Zephyr/NCS supports concurrent Central + Peripheral roles via the BLE multi-role API.

**Key behaviors:**
- Continuously scan for fob by Fob Service UUID (Central role)
- Advertise Command Service UUID so the Flutter app can connect (Peripheral role)
- On fob notification **or** app Write received → same LED trigger code path (green 3s or red 3s)
- USB serial for debug logging

## BLE Protocol

**Fob → Receiver** (Fob as Peripheral, Receiver as Central):

| Item | Value |
|---|---|
| Service UUID | Custom 128-bit (e.g. `12345678-1234-1234-1234-123456789ABC`) |
| Characteristic UUID | Custom 128-bit |
| Property | Notify |
| Payload | 1 byte (`0x01` = unlock, `0x02` = lock) |

**App → Receiver** (Flutter app as Central, nRF52840 as Peripheral):

| Item | Value |
|---|---|
| Service UUID | Custom 128-bit — **distinct UUID from fob service** (e.g. `ABCDEF01-1234-1234-1234-123456789ABC`) |
| Characteristic UUID | Custom 128-bit |
| Property | Write (with response) |
| Payload | 1 byte (`0x01` = unlock, `0x02` = lock) |

## Tasks

- [ ] Purchase second Raytac MDBT50Q-DB-40 dev board
- [ ] Wire tactile button to fob dev board GPIO
- [ ] Flash fob firmware (BLE Peripheral, button notification with lock/unlock payload)
- [ ] Update receiver firmware to dual Central + Peripheral roles
- [ ] Confirm fob button press triggers correct LED (unlock = green 3s, lock = red 3s)
- [ ] Confirm app still triggers correct LED independently
- [ ] Confirm both fob and app can operate without interfering with each other

## Success Criteria

- Pressing unlock on fob → green LED on 3 seconds
- Pressing lock on fob → red LED on 3 seconds
- App lock/unlock still works simultaneously
- BLE connection for both roles reliable at 10m
