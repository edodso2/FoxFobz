# Phase 3 — App Finalization

**Goal:** Harden the Flutter app built in Phase 1. Lock/unlock is the only scope. Focus areas: security foundations, automated tests, polished UI, and reliable BLE reconnection. No new features — solid base only.

## Stack

- **Framework:** Flutter (iOS target)
- **BLE library:** `flutter_blue_plus`

## Security

- **LE Secure Connections (LESC)** for all BLE bonds — uses ECDH, mandatory Bluetooth 5+, resists passive eavesdropping
- **Numeric Comparison pairing** (not Just Works) — provides MITM protection during the bond handshake
- BLE bonding with the receiver — store bond keys on device so the app only controls its paired receiver
- Authenticated BLE writes — receiver rejects Write commands from unbonded centrals
- **Per-command challenge-response** using AES-128 (nRF52840 hardware crypto) — receiver issues a random nonce per command, fob/app must sign it; prevents replay attacks even from a bonded device (coordinate with Phase 4 firmware)
- No cloud backend — all communication is local BLE

**Pairing security model (dual-fob root of trust):**
- The product **ships pre-paired** — receiver and both fobs are bonded before the box is sealed. The user never does an initial pairing ceremony.
- **The fobs are the root of trust.** The phone app is just another paired device — it has no privileged owner role. No device can be paired without fob authorization.
- **Any 2 currently paired fobs must confirm** any new pairing (phone, replacement fob, additional fob). The new device requests pairing, the receiver enters a pending state, and any 2 paired fobs must long-press within a 30-second window for the bond to complete. This means a user with 3+ fobs can lose one and still authorize new pairings using any 2 of the remaining fobs.
- **Any 2 currently paired fobs can also revoke** a lost fob's bond — removing it from the receiver's paired list so a finder of the lost fob cannot use it.
- **The external pairing button does not pair devices.** It only signals the receiver to enter the pending-authorization state for the incoming device's request.
- **Factory reset is inaccessible from the outside of a sealed enclosure** — requires opening the case. This is intentional: physical access to the outside of the receiver is not sufficient to reset it and pair rogue devices.

## App Features (finalized scope)

- [ ] Scan for receiver by Command Service UUID, connect, and bond
- [ ] Lock and Unlock buttons — Write `0x01` (unlock) or `0x02` (lock) with response confirmation
- [ ] Display connection status: disconnected / connected / sending
- [ ] Auto-reconnect when receiver comes back in range
- [ ] Handle Write failure gracefully with user feedback

## Pairing Flow (App Side)

**Pairing the phone (requires any 2 paired fobs present):**
- [ ] "Pair with Receiver" button in app settings
- [ ] App requests pairing connection to receiver (receiver enters pending-authorization state, LED blinks)
- [ ] App displays: "Press any 2 key fobs to authorize" with a 30-second countdown
- [ ] Any 2 paired fobs long-press → receiver completes LESC bond with app
- [ ] On success → store bond, show confirmation, unlock Lock/Unlock screen
- [ ] On timeout or fewer than 2 fobs confirming → pairing rejected, app shows failure

**Adding a new device (requires any 2 paired fobs — same flow for any device type):**
- [ ] "Add Device" in app settings — initiates pairing request to receiver
- [ ] Same any-2-fob confirmation flow as above
- [ ] On success → receiver LED flashes twice, app shows device added

**Revoking a lost fob (requires any 2 paired fobs):**
- [ ] "Remove Device" in app settings — sends revoke command to receiver
- [ ] Any 2 paired fobs long-press to authorize removal within 30-second window
- [ ] On success → receiver removes lost fob's bond record, it can no longer control the receiver

## Automated Tests

- [ ] Widget tests for Lock and Unlock button states
- [ ] Unit tests for BLE command encoding (`0x01` / `0x02` payload construction)
- [ ] Integration tests using a BLE mock layer (no real hardware required to run tests in CI)

## Notes

- Use `writeWithResponse: true` for confirmed delivery
- CoreBluetooth (iOS) requires BLE usage string in `Info.plist`
- No monitoring of fob button events — that logic is receiver-internal
- Standard BLE protocol — no vendor-specific Nordic SDK needed in the app
