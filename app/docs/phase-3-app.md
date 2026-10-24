# Phase 3 — App Finalization Build Spec

## Goal

Harden the Phase 1 app for real-world use. Lock/unlock is still the only functional scope — no new commands. Focus areas: LESC bonding, dual-fob pairing authorization UI, per-command challenge-response, auto-reconnect, polished UI states, and automated tests.

---

## Scope

**In scope:**
- LESC bonding with the receiver (Numeric Comparison — MITM protected)
- Pairing flow with dual-fob authorization UI
- Add Device / Remove Device flows
- Per-command challenge-response (AES-128 nonce signing — firmware-coordinated)
- Auto-reconnect when receiver comes back in range
- Write failure handling with user-visible feedback
- Polished lock/unlock button states (idle / sending / success / error)
- Widget tests, unit tests, integration tests with BLE mock

**Out of scope:**
- New commands beyond lock/unlock
- Android support
- Activity logs, battery monitoring, time schedules
- OTA firmware updates

---

## Security

### BLE Bonding

- Use **LE Secure Connections (LESC)** — mandatory Bluetooth 5+, ECDH key exchange
- **Numeric Comparison** pairing mode — user confirms matching 6-digit codes on both devices (MITM protection)
- After bonding, store keys on device — app only connects to its bonded receiver
- Receiver rejects Write commands from unbonded centrals

### Per-Command Challenge-Response

Coordinates with Phase 4 firmware. The receiver issues a fresh nonce for each command before the write is accepted:

```
App                              Receiver
 |-- Write 0x01 (unlock) -------->|
 |<-- Nonce (8 bytes) ------------|
 |-- AES128(device_key, nonce) -->|
 |<-- Write response (success) ---|
```

- `device_key` is derived from the BLE LTK established at bond time — unique per device
- Prevents replay attacks even from a bonded but compromised device
- App-side implementation: read nonce from response notification, compute AES-128, write signed payload
- **Do not implement this until Phase 4 firmware is ready** — it requires firmware coordination

---

## Pairing Model

The app is **not the owner** of the receiver. The fobs are the root of trust. The phone is just another paired device with no privileged role.

**Adding the phone (first-time pairing):**
1. User taps "Pair with Receiver" in app settings
2. App initiates a BLE connection to the receiver
3. Receiver enters pending-authorization state (LED blinks)
4. App displays: "Press any 2 key fobs to authorize" with a 30-second countdown
5. Any 2 currently paired fobs long-press their buttons → receiver confirms bond
6. App completes LESC pairing, stores bond keys, navigates to main lock/unlock screen
7. On timeout or fewer than 2 fobs: pairing rejected, app shows failure message

**Adding a new device:**
- Same flow as above, initiated from "Add Device" in settings

**Revoking a lost device:**
1. User taps "Remove Device" in settings, selects the device
2. App sends revoke command to receiver
3. Any 2 currently paired fobs long-press to authorize removal within 30-second window
4. On success: receiver removes the device's bond record

---

## App Features

### Screens

**HomeScreen** (lock/unlock):
- Lock and Unlock buttons with states: idle / sending / success / error
- Connection status: disconnected / connected / reconnecting
- "Pair with Receiver" prompt if not yet bonded

**SettingsScreen**:
- "Pair with Receiver" — initiates bonding flow
- "Add Device" — same authorization flow for adding additional phones/fobs
- "Remove Device" — initiates revoke flow
- List of paired devices (read from receiver)

**PairingScreen** (modal/sheet):
- Countdown timer (30 seconds)
- Instruction: "Press any 2 key fobs to authorize"
- Success / failure states

### BLE Behaviors

- **Auto-reconnect:** On connection drop, immediately begin scanning for the bonded receiver by UUID. Reconnect silently in the background. Show "Reconnecting..." status during the attempt.
- **Write failure:** If a write fails or times out, show an error state on the button and a brief message. Do not silently swallow errors.
- **Bond persistence:** Bond keys survive app restarts (CoreBluetooth handles this on iOS via the system bond store).

---

## Automated Tests

### Widget Tests

- Lock button shows "sending" state while write is in progress
- Unlock button shows "sending" state while write is in progress
- Buttons are disabled when disconnected
- Success state displayed after confirmed write response
- Error state displayed on write failure

### Unit Tests

- `0x01` payload constructed correctly for unlock command
- `0x02` payload constructed correctly for lock command
- AES-128 challenge-response signing produces correct output for known nonce + key (Phase 3+)

### Integration Tests

- BLE service layer uses a mock `BleAdapter` interface in tests — no real hardware required
- Full scan → connect → write → response cycle covered by integration test against mock
- Reconnect logic tested by simulating connection drop in mock

---

## State (Riverpod)

```
bleConnectionStateProvider     — StreamProvider<BleConnectionState>
bleCommandProvider             — NotifierProvider — exposes lock(), unlock()
pairingFlowProvider            — NotifierProvider — manages pairing state machine
pairedDevicesProvider          — FutureProvider<List<PairedDevice>>
```

---

## iOS Platform Notes

- Background reconnection requires `bluetooth-central` background mode in `Info.plist`
- `NSBluetoothAlwaysUsageDescription` must remain in `Info.plist`
- CoreBluetooth stores bond keys in the system keychain — no manual key storage needed in the app
- Standard BLE only — no Nordic vendor SDK required in the app layer

---

## Success Criteria

- App bonds securely via LESC with Numeric Comparison
- Pairing the phone requires any 2 fobs to confirm
- Lock/unlock buttons show correct states at all times
- Auto-reconnect works when receiver comes back in range
- All widget, unit, and integration tests pass
