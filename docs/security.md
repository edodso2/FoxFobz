# Security & Provisioning

Target security model for production units. **None of this is implemented yet.** The POC firmware (`protocol/v1`) is unauthenticated and replayable. Each section is marked **Decided** or **Open**. Settled decisions also have a decision record: [0005](decisions/0005-no-proximity-auto-unlock.md) (no proximity unlock), [0006](decisions/0006-preprovisioned-dual-fob-authorization.md) (pre-paired, 2-fob approval). The app side is in [app/docs/phase-3-app.md](../app/docs/phase-3-app.md).

## Threat model in one paragraph

Main threats:
- Replayed or forged unlock commands (sniffed fob or app traffic)
- Cloned or unauthorized devices
- Someone with physical access to the *outside* of the installed receiver pairing a rogue device
- Firmware readout or replacement over SWD

Out of scope: proximity unlock (removed because of relay attacks), and attackers with bench equipment and the receiver on their desk (see the APPROTECT caveat). This is the same protection level as typical consumer and automotive BLE locks at this tier.

## Trust model — Decided

- **Units ship pre-paired.** The receiver and its fobs are provisioned together at the factory. The user never does a first-time pairing.
- **The fobs are the root of trust.** No device, including the phone, has an owner role.
- **Adding or revoking any device needs any 2 currently paired fobs** to long-press within a 30 s window. With 3+ fobs, a lost one can be revoked using the others.
- **The pairing button on the receiver** only opens the pending-authorization window. It grants nothing by itself.
- **Factory reset** is internal only: a GPIO strap held at power-on, or a recessed button reachable only with the unit out of the car and the case open. It wipes all pairings, so the unit must then be re-provisioned by the manufacturer.
- **Fewer than 2 fobs left** means an RMA: the unit is sent back for re-provisioning. There is no remote recovery path, by design (the car-dealership model).
- **Paired-device limit** is configurable. The default is 4: 2 fobs + phone + 1 spare.

## Command authentication

### App → receiver (GATT) — Decided
- LESC bonding with Numeric Comparison (MITM protected). The receiver rejects writes from unbonded centrals at the ATT permission level.
- Per-command challenge-response: the receiver sends a random nonce, the app answers with `AES128(device_key, nonce)` within 500 ms, and wrong or replayed answers are rejected. `device_key` is unique per bonded device. Message flow: [ble-protocol.md](protocol/ble-protocol.md#phase-3-protocol-bonded--challenge-response).

### Fob → receiver (broadcast) — **Open**
The original design assumed the fob **connects and bonds** like the app. The fob now sends non-connectable broadcasts ([0004](decisions/0004-fob-broadcast-not-connection.md)), so there is no LESC bond and no nonce round-trip. Proposed replacement, to be decided:
- **Per-fob secret key** written over SWD at provisioning, shared only with its receiver.
- **Each packet carries** a monotonic counter plus a truncated AES-CCM MAC over (fob id, command, counter). The nRF52805 has the hardware for this.
- **The receiver stores** the last accepted counter per fob in flash and rejects anything that isn't newer (anti-replay). It accepts a window ahead to tolerate presses made out of range.
- **The counter must survive** fob battery changes (keep it in flash, with write-wear management).
- **The 2-fob approval** becomes a distinct authenticated broadcast command, sent on a long press (≥ 3 s), that the receiver only acts on during the pending window.
- Bumps the protocol to `protocol/v2`. This must be in place before M5 sign-off.

## Device identity & keys — Decided (receiver), Open (fob)

- **`FICR.DEVICEID`**: a 64-bit ID burned at the Nordic factory. It survives ERASEALL and reflashing, and is the primary key in the manufacturing database. It is logged at provisioning and at every RMA.
- **Receiver (nRF52840, CryptoCell):** a random 128-bit Hardware Unique Key is injected at provisioning into a flash page. The bootloader loads it into the CryptoCell KDR at boot and then locks the page. The app firmware can use the key but can't read it. Per-device keys are derived with HKDF.
- **Fob (nRF52805, no CryptoCell):** how to store its key is **open**. Options: a protected flash region under APPROTECT, or a key derived from DEVICEID plus a factory secret.

## Firmware integrity — Decided

- **MCUboot** with ECDSA P-256 signing. Unsigned images are rejected at boot.
- **Signing key** stays on a USB hardware key (e.g. YubiKey HSM 2). It never exists as a plaintext file.
- **APPROTECT** is set in UICR after provisioning, which locks SWD. The only way back is ERASEALL, which wipes everything.
- **Caveat:** nRF52840 Rev 2 silicon (build code `DXX`) has a published voltage-glitch bypass of APPROTECT; Rev 3 (`Fx0`) is hardened. **Open:** read `NRF_FICR->INFO.VARIANT` on the received MDBT50Q modules and record which revision ships. The MDBT42T needs the same check.
- **Open:** OTA updates (MCUboot slots + app DFU) are a future feature, not M5 scope.

## Factory provisioning — Decided (process), Open (jig)

Per unit, on a pogo-pin jig that reaches the SWD pads of the receiver and its fobs. **No BLE pairing ceremony.**

1. Connect all boards to the jig.
2. Read `FICR.DEVICEID` from each and log the unit group in the manufacturing database.
3. Generate this unit group's credentials: fob keys, receiver key, initial counters.
4. Sign the provisioning package with the manufacturer key (on the hardware key).
5. Flash MCUboot + signed firmware (`nrfjprog` / `west flash`).
6. Write the keys and pairing records into their flash regions over SWD.
7. Enable APPROTECT (`nrfjprog --program uicr_settings.hex`).
8. Functional check (lock/unlock), then seal.

**Open:** jig design (3D-printed, 2.54 mm pogo pins, scripted with `nrfjprog` + signing tool), and whether to build it in-house or use a programming service. The receiver revA has a 10-pin 1.27 mm SWD header (J1). Decide whether production boards get pogo pads instead. The programmer is the nRF52840-DK for the first ~50 units, a J-Link BASE after that. See [production notes](production/nrf52840-production-notes.md).

## RMA re-provisioning — Decided

1. The customer ships back the receiver and remaining fob(s).
2. Read `FICR.DEVICEID` from all of them and log the RMA event.
3. Run `nrfjprog --eraseall` on each. This removes SWD protection and wipes all flash and UICR, including keys and pairings.
4. Run factory provisioning steps 3–8 with the new or replacement fobs, then ship back.

## Firmware tasks (when this work starts)

- [ ] Fob deep sleep with GPIO wake; target < 5 µA measured on the bare module
- [ ] Fob long-press detection (authorization signal); hardware + software debounce
- [ ] Authenticated fob packets + per-fob counter tracking in receiver flash (`protocol/v2`)
- [ ] Receiver pending-authorization state machine: 30 s window, any 2 distinct fobs
- [ ] Revocation flow; paired list stored in flash and surviving power cycles
- [ ] LED feedback: blink during window, one flash per confirming fob, double flash on success, error pattern on reject
- [ ] Factory-reset strap
- [ ] App LESC bonding + challenge-response on the receiver
- [ ] MCUboot + signing pipeline; APPROTECT step in provisioning
- [ ] Configurable motor run time stored in flash
