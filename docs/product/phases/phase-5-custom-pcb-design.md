# Phase 5 — Custom PCB Design (KiCad)

**Goal:** Design production-ready PCBs for the fob and receiver. The receiver board routes 12V to car door lock/unlock actuators via smart switches. Both boards include fuses and proper protection circuits.

---

## Fob Board Requirements

- Raytac MDBT50Q-1MV2 footprint (SMD)
- CR2032 coin cell holder
- 1–2 tactile buttons (lock / unlock) — long-press on either button triggers pairing mode
- Status LED (with high-value resistor to protect battery) — used for pairing feedback and connection state
- Optional: NFC pad (nRF52840 has NFC for tap-to-pair)
- SWD test pads (SWDIO, SWDCLK, GND, VCC, RESET) — pogo-pin friendly, on the PCB interior; can be covered with conformal coating after production
- Fuse on battery line (e.g. 100mA polyfuse)
- Keep board under 35mm × 25mm to fit standard key fob enclosure

---

## Receiver Board Requirements

- Raytac MDBT50Q-1MV2 footprint (SMD)
- 12V input (BK/W) via fused screw terminal (blade fuse holder, 20A) — protects board logic and regulation circuitry
- Voltage regulation: 12V → 3.3V LDO (TLE42744GV33ATMA1) for nRF52840
- **Lock output:** DRV8873-Q1 H-bridge motor driver to route 12V to door lock actuator (driver's door motor)
- **Unlock output:** DRV8873-Q1 H-bridge motor driver to route 12V to door unlock actuator (passenger's door motor)
- No per-output fuses required — DRV8873-Q1 provides electronic overcurrent protection and the factory 30A inline circuit breaker on BK/W protects the motor wiring (see Power Architecture)
- Screw terminals for 12V input and each actuator output (PK/BK and PK/O)
- Dedicated chassis ground via ring terminal — board ground must NOT connect to Ford switch circuit ground (G313) as that ground is switched and changes state with door switch presses
- Transient voltage suppressor (TVS) diode on 12V input to protect against load dump spikes from car electrical system
- Reverse polarity protection diode on 12V input
- **Pairing button** accessible on enclosure (tactile button — signals receiver to enter pending-authorization state; does NOT grant authorization on its own)
- **Status LED** accessible on enclosure — blinks during pending-authorization window, flashes per confirming fob, double-flash on success, error pattern on rejection
- **SWD test pads** (SWDIO, SWDCLK, GND, VCC, RESET) — pogo-pin friendly, on the PCB interior accessible only when the enclosure is open; used for factory provisioning and RMA re-provisioning via J-Link
- USB port for programming during development (nRF52840 has native USB — no FTDI chip needed)

### Power Architecture

The receiver board uses BK/W as its sole 12V source for both logic power and motor drive power. A dedicated chassis ring terminal provides the board ground reference.

| Rail | Source | Purpose |
|---|---|---|
| 12V motor supply (DRV8873 PVDD) | BK/W via 20a board fuse | DRV8873-Q1 motor drive power for both door motors |
| 3.3V logic | TLE42744GV33ATMA1 LDO from BK/W | nRF52840 + all logic |
| Ground | Dedicated chassis ring terminal | All board ground references |

**Why BK/W for PVDD:** All motor current flows through BK/W → DRV8873 → motors, preserving the factory 30A circuit breaker protection chain. If a door lock motor jams or draws excessive current the factory breaker will still trip exactly as Ford intended. The board's interception of the circuit does not break this protection.

**Why dedicated ring terminal ground:** The Ford switch circuit ground path through G313 is a switched ground — it changes state depending on which door switch is pressed. Tying board ground to this circuit would create unstable or floating ground references under the logic and motor drivers. A dedicated chassis ground ring terminal completely isolates the board from this switching behavior.

### Signal Input Architecture

The receiver board interfaces with the Ford door lock circuit at connector C315. Based on bench testing (see Appendix), the following input architecture was validated:

- **Driver's side PK/LG and PK/Y** connect directly to nRF52840 GPIO pins. When the driver's door switch is pressed these wires are pulled to ground. GPIO pins must be configured with 10kΩ external pull-up resistors so the pin reads HIGH at rest and LOW when the switch is pressed.
- **Passenger's side PK/LG and PK/Y** connect to nRF52840 GPIO pins through a voltage divider and Zener clamp circuit. When the passenger door switch is pressed these wires are driven to 12V. The voltage divider (47kΩ / 22kΩ) scales this to ~3.3V and a 3.3V Zener clamp protects the GPIO. At rest these wires sit at ground so the GPIO reads LOW at rest and HIGH when the switch is pressed (opposite polarity to driver side — handle in firmware).

### Output Architecture

The receiver board connects to the motor side of C315 via an adapter harness. Two DRV8873-Q1 H-bridge drivers independently control the driver's door motor and passenger's door motor via PK/BK and PK/O wires. This enables independent per-door lock/unlock control from the BLE fob while preserving normal manual switch operation through the existing Ford wiring.

**Signal flow:**
- Manual switch press → PK/LG or PK/Y → voltage divider (passenger side) or direct GPIO (driver side) → nRF52840 → DRV8873-Q1 → motor
- BLE fob press → nRF52840 → DRV8873-Q1 → motor

---

## Additional Outputs

Due to amp ratings we cannot utilize the existing 12V from door lock system. We need a dedicated wire running from battery with 30 amp fuse. This will be a separate section of the board inside our existing housing that is marketed as an add on feature for additional money.

- **Hazard Output** board → smart switch → Diode → C211 (hazards) (10 amps)
- **Horn Output** board → smart switch → C209 (horn, no diode needed since it's a dead end circuit) (20 amps)

---

## Parts Lists

### Fob Board Parts

| # | Component | Link |
|---|---|---|
| 1 | Raytac MDBT50Q-1MV2 (BLE + MCU) | [DigiKey](https://www.digikey.com/en/products/detail/raytac/mdbt50q-1mv2/13677591) |
| 2 | Status LED | [DigiKey](https://www.digikey.com/en/products/detail/w%C3%BCrth-elektronik/150060bs75000/4489895) |

### Receiver Board Parts

Simplified BOM with JLCPCB part numbers, quantities and sourcing links:
📄 **[Receiver BOM CSV](../../../hardware/receiver/docs/early-bom.csv)**

> NOTE full BOM will be generated by KiCad. We did not included every resistor and capacitor. When adding each major component tot he KiCad schematic we check against datasheets and add these. 

### Notable Alternatives

- 4.5A smart switches: [BTS70401EPAXUMA1](https://www.digikey.com/en/products/detail/infineon-technologies/BTS70401EPAXUMA1/9829552)
- Separate boards connected via header pins:
  - Connector (on each board): [Molex 0530470610](https://www.digikey.com/en/products/detail/molex/0530470610/242857)
  - Cable: [Molex 0151340600](https://www.digikey.com/en/products/detail/molex/0151340600/6198154)
- Automotive multi-switch detection interface (if more inputs needed): [NXP MC33972ATEKR2](https://www.digikey.com/en/products/detail/nxp-usa-inc/MC33972ATEKR2/2552408)

---

## KiCad Checklist

### Fob Board

- [ ] Import Raytac MDBT50Q-1MV2 KiCad footprint (available from Raytac directly, SnapEDA, or UltraLibrarian)
- [ ] Follow Raytac layout guidelines: keep clearance around chip antenna, no copper pour under antenna area
- [ ] Place CR2032 coin cell holder with appropriate footprint
- [ ] Add tactile button footprints for lock and unlock
- [ ] Add status LED with current-limiting resistor (high value to protect battery)
- [ ] Add polyfuse (100mA) on battery line
- [ ] Add SWD test pads (SWDIO, SWDCLK, GND, VCC, RESET) — pogo-pin friendly, interior placement
- [ ] Add FCC ID label silkscreen referencing Raytac FCC ID
- [ ] Verify board fits within 35mm × 25mm outline
- [ ] Optional: Add NFC antenna pad per nRF52840 NFC guidelines
- [ ] Run DRC before sending to fab

### Receiver Board

- [ ] Import Raytac MDBT50Q-1MV2 KiCad footprint (available from Raytac directly, SnapEDA, or UltraLibrarian)
- [ ] Follow Raytac layout guidelines: keep clearance around chip antenna, no copper pour under antenna area
- [ ] Place DRV8873-Q1 x2 with thermal pad connected to ground pour and thermal vias — one per door motor
- [ ] Connect DRV8873-Q1 PVDD pins to BK/W rail (after 20a fuse and reverse polarity diode)
- [ ] Add TLE42744GV33ATMA1 3.3V LDO with input/output bypass capacitors per datasheet
- [ ] Add TVS diode on 12V BK/W input rail
- [ ] Add reverse polarity protection diode (MBRA340T3G) on 12V input after fuse
- [ ] Add blade fuse holder footprint on 12V BK/W input (20A)
- [ ] Add dedicated chassis ground connection point — ring terminal pad, isolated from Ford switch circuit ground G313
- [ ] Add screw terminals for BK/W input and each motor output (PK/BK and PK/O)
- [ ] Add voltage divider circuit (47kΩ / 22kΩ) with 3.3V Zener clamp and 100nF filter cap for passenger side PK/LG and PK/Y inputs
- [ ] Add 10kΩ external pull-up resistors to 3.3V on driver side PK/LG and PK/Y GPIO inputs
- [ ] Add pairing button footprint (accessible from enclosure)
- [ ] Add status LED with current-limiting resistor (accessible from enclosure)
- [ ] Add SWD test pads (SWDIO, SWDCLK, GND, VCC, RESET) — pogo-pin friendly, interior placement
- [ ] Add USB connector footprint for development programming
- [ ] Size DRV8873-Q1 decoupling capacitors per TI datasheet recommendations
- [ ] No copper pour under MDBT50Q antenna area
- [ ] Add FCC ID label silkscreen referencing Raytac FCC ID
- [ ] Add Additional Outputs section (hazard and horn smart switches) with 30A fused battery input
- [ ] Run DRC before sending to fab

---

## Recommended PCB Fab (Prototype)

JLCPCB — supports 2-layer boards at low cost for prototyping. 5 boards for ~$5 shipped. MDBT50Q-1MV2 supported via co-sign assembly service.

---


## Appendix — Bench Tests and Circuit Investigation

Moved to [testing/bench/mustang-1988-bench-tests.md](../../../testing/bench/mustang-1988-bench-tests.md).
