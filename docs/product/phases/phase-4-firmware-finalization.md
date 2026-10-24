# Phase 4 — Firmware Finalization

**Goal:** Replace the minimal Phase 1/2 firmware with clean, production-ready firmware on both boards. Proper sleep, reconnection logic, debouncing, and security hardening.

## Tools

- **IDE:** VS Code with nRF Connect for VS Code extension
- **Both boards:** Zephyr RTOS + nRF Connect SDK (NCS), built with `west`
- **BLE library:** Zephyr BLE stack (`zephyr/bluetooth/bluetooth.h`) — same APIs on both sides
- **Bootloader:** MCUboot with ECDSA P-256 firmware signing — all production images must be signed by the manufacturer private key; unsigned images are rejected at boot
- **Signing key storage:** Private key held in a USB HSM (e.g. YubiKey HSM 2); the key never exists as a plaintext file on disk

## Device Identity and Provisioning Security

**FICR.DEVICEID — hardware anchor:**
- The nRF52840 contains a 64-bit unique ID burned at Nordic's factory (`NRF_FICR->DEVICEID[0/1]`) that survives ERASEALL, firmware replacement, and UICR wipe — it cannot be changed
- This is the key for the manufacturing database: every device is logged by DEVICEID at provisioning time and again at any RMA re-provisioning event

**KDR / Hardware Unique Key — per-device challenge-response key derivation:**
- At provisioning time, a unique random 128-bit Hardware Unique Key (HUK) is injected into a locked flash region via SWD
- The bootloader writes the HUK into CryptoCell's KDR register at each boot and then locks the flash page — application firmware can use it for AES-128 operations via CryptoCell but cannot read the raw key value
- Per-device challenge-response keys are derived from the HUK using HKDF — the raw key material never appears in application-accessible memory at runtime

**APPROTECT — SWD lockdown:**
- APPROTECT is enabled in UICR after provisioning — locks the SWD debug port; the only escape is ERASEALL via CTRL-AP, which wipes all flash
- **Known limitation:** Current MDBT50Q-1MV2 modules likely contain Rev 2 silicon (build code DXX) which has a published voltage-glitching bypass for APPROTECT. A well-resourced attacker with bench equipment could potentially read flash without triggering ERASEALL. APPROTECT provides strong deterrence and protects against software attacks; it is not a tamper-proof vault. This is consistent with the protection level of most consumer BLE locks and automotive BLE implementations at this tier.
- Verify silicon revision on received modules: read `NRF_FICR->INFO.VARIANT` — Rev 3 (Fx0) has a hardened APPROTECT that is enabled by default

## Factory Provisioning (SWD-Injected Bond Data)

All three devices (receiver + 2 fobs) are provisioned on a pogo-pin jig before the box is sealed. **No BLE pairing ceremony is run during manufacturing** — bond records are written directly to flash via `nrfjprog`. This eliminates the chicken-and-egg problem of needing fobs to authorize the very first pairing.

**Provisioning sequence:**
1. Connect all three boards to the provisioning jig (SWD pogo pins)
2. Read and log `FICR.DEVICEID` for all three devices into the manufacturing database
3. Generate a unique bond credential set for this {receiver, fob1, fob2} group on the provisioning host
4. Sign the provisioning data package with the manufacturer ECDSA private key (via USB HSM)
5. Flash firmware + MCUboot bootloader to all three devices via `nrfjprog`
6. Inject HUK and bond data into designated flash regions via SWD
7. Enable APPROTECT in UICR on all three devices (`nrfjprog --program uicr_settings.hex`)
8. Devices are now sealed — SWD locked, factory state confirmed

## RMA Re-Provisioning (Device Shipped Back to Manufacturer)

Required when a customer has lost one fob and cannot meet the dual-fob requirement to pair a replacement. No remote re-provisioning pathway exists — this is by design.

**Re-provisioning sequence:**
1. Customer ships receiver + remaining fob(s) back to manufacturer
2. Before erasing: connect J-Link, read `FICR.DEVICEID` from all returned devices, log the RMA event in the manufacturing database
3. Issue `nrfjprog --eraseall` on all returned devices (unlocks SWD, wipes all flash and UICR including bond data and HUK)
4. Reflash current production firmware + MCUboot bootloader
5. Generate new bond credential set for the replacement device group
6. Inject new HUK and bond data via SWD (same as factory provisioning)
7. Seal APPROTECT, ship back to customer

## Fob Firmware (Zephyr / NCS)

`prj.conf`:
```ini
CONFIG_BT=y
CONFIG_BT_PERIPHERAL=y
CONFIG_BT_DEVICE_NAME="FoxFobz Fob"
CONFIG_PM=y
CONFIG_PM_DEVICE=y
```

Build: `west build -b raytac_mdbt50q_db_40/nrf52840 .`

**Key behaviors:**
- Deep sleep by default (~2µA)
- Wake on button press (GPIO interrupt)
- Hardware debounce on button + software debounce in firmware
- Advertise and connect, send BLE notification with lock/unlock payload
- Return to deep sleep after 3 seconds of inactivity
- Support challenge-response or token auth (coordinate with Phase 3 app security)

## Receiver Firmware (Zephyr / NCS)

`prj.conf`:
```ini
CONFIG_BT=y
CONFIG_BT_PERIPHERAL=y
CONFIG_BT_CENTRAL=y
CONFIG_BT_DEVICE_NAME="FoxFobz Receiver"
```

Build: `west build -b raytac_mdbt50q_db_40/nrf52840 .`

**Key behaviors:**
- Dual BLE roles: Central (scanning for fob) + Peripheral (advertising to app) — running concurrently
- Auto-reconnect to fob if it goes out of range
- Validate auth token / challenge-response before acting on any command
- Reject Write commands from unbonded centrals
- Configurable output pulse duration (stored in flash)
- Status LED for connection state
- USB serial for debug logging

## Pairing Mode (Receiver) — Dual-Fob Authorization Model

**Ships pre-paired.** The receiver leaves the factory with both fobs already bonded. The user never performs an initial pairing ceremony. The receiver's external pairing button only signals "I am ready to accept a new device's connection request" — it does not grant authorization by itself.

**Adding any new device (phone, replacement fob, additional fob):**
- New device initiates a BLE connection to the receiver
- Receiver enters pending-authorization state → LED blinks rapidly
- **Any 2** currently paired fobs must long-press within a 30-second window to authorize
- Each fob long-press → receiver LED flashes once as acknowledgment (receiver tracks which fobs have confirmed)
- After any 2 fobs confirm → LESC bond completes, new device is added to paired list, LED flashes twice
- If fewer than 2 fobs confirm within the window → pairing is rejected, LED flashes error pattern, connection dropped

**Revoking a device (remove lost fob or old phone from paired list):**
- Any 2 currently paired fobs long-press to authorize a revoke command (sent via the phone app or a specific button sequence)
- Receiver removes the target device's bond record from flash
- Revoked device can no longer connect or send commands

**At all times:**
- Outside pending-authorization state: reject connection attempts from unbonded devices
- Per-command challenge-response: on each lock/unlock command, issue a 4-byte random nonce; fob/app must return `AES128(device_key, nonce)` within 500ms; reject if incorrect or replayed
- Device key derived from each device's BLE LTK at bond time — unique per device
- Maximum paired devices: configurable in firmware (default 4 — 2 fobs + phone + 1 spare slot)

**Factory reset:**
- Not accessible from the outside of a sealed enclosure — requires opening the case
- Implemented as a dedicated internal reset pin (tied to a specific GPIO) held LOW during power-on, or a recessed button not reachable without removing the unit from the car
- On reset: all bonds wiped, receiver returns to factory state (pre-paired fob bonds must be re-flashed via SWD or provisioned by the manufacturer)

## Pairing Mode (Fob)

**Confirming a new device pairing:**
- When receiver is in pending-authorization state, fob long-press (3 seconds) sends an authorization signal
- Fob LED flashes once to confirm it sent authorization
- Normal short press is NOT interpreted as authorization — must be a deliberate long-press

**Adding a replacement fob (one fob lost, one remaining):**
- Only 1 fob available — cannot meet the any-2 requirement
- RMA required: ship back to manufacturer for re-provisioning via SWD
- This is a deliberate security tradeoff: losing all but one fob (with no additional fobs added) requires physical re-provisioning — same as a car dealership

**Revoking a lost fob (2+ fobs still in hand):**
- Any 2 remaining fobs long-press to authorize revocation of the lost fob's bond
- Fob LED flashes once per confirming fob, receiver removes the lost fob's record after both confirm

## Tasks

- [ ] Implement deep sleep + GPIO wake on fob
- [ ] Implement hardware + software button debounce
- [ ] Implement fob auto-sleep after inactivity timeout
- [ ] Implement long-press detection on fob button (authorization signal)
- [ ] Implement receiver pending-authorization state machine (30s window, wait for any 2 fob confirmations)
- [ ] Implement any-2-fob confirmation tracking (receiver tracks which paired fobs have confirmed; completes bond once any 2 have confirmed)
- [ ] Implement device revocation flow (any 2 fobs authorize removal of a bond record from flash)
- [ ] Implement per-bond LED feedback (one flash per confirming fob, two flashes on success, error pattern on rejection)
- [ ] Store paired device list (default max 4) in flash on receiver
- [ ] Implement factory reset via internal GPIO pin held LOW on power-on
- [ ] Implement per-command challenge-response (AES-128, nRF52840 hardware crypto)
- [ ] Implement receiver rejection of unbonded connections and failed challenge-response
- [ ] Implement receiver auto-reconnect logic for fob disconnects
- [ ] Store configurable pulse duration in flash on receiver
- [ ] Measure fob deep sleep current < 5µA on bare module
- [ ] Confirm BLE reconnect after fob goes in/out of range

## Success Criteria

- Adding phone: any 2 paired fobs long-press within 30 seconds → LESC bond completes, LED flashes twice
- Adding device with only 1 fob confirming → pairing rejected, error LED pattern
- Adding device with no fob confirming within 30 seconds → pairing times out, rejected
- With 3 fobs paired, losing one fob: any 2 remaining fobs can still authorize new pairings and revoke the lost fob's bond
- Receiver rejects commands with incorrect or replayed challenge-response
- Paired device list survives power cycle
- Factory reset via internal pin wipes all bonds and returns to factory state
- Fob deep sleep current < 5µA measured on bare module
- Fob reconnects to receiver within 3 seconds after coming back in range
- BLE reliable at 10m in both Central and Peripheral roles simultaneously
