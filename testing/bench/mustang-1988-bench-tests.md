# 1988 Mustang — Bench Tests and Circuit Investigation

This section documents the key tests performed on the 1988 Ford Mustang door lock circuit that drove the design decisions for the receiver board.

## Background: Ford Door Lock Circuit (Circuit 68 — Power Door Locks)

The stock Ford system is powered through a 30A inline circuit breaker on wire **171 BK/W** (always hot 12V). The system uses two switches (driver LH and passenger RH) on the door armrests. The passenger switch is the "power hub" side — it contains the two motor feed wires that run to both door lock motors. The driver switch is the "ground hub" side — it grounds through splice S306 to ground point G313.

**Key wires at connector C315 (driver side):**
- **171 BK/W** — 12V system power
- **120 PK/LG** — interconnect between driver and passenger switches (lock direction)
- **119 PK/Y** — interconnect between driver and passenger switches (unlock direction)
- **117 PK/BK** — motor feed (one direction)
- **118 PK/O** — motor feed (other direction)

Current flows through the motors in opposite directions to lock vs unlock. Both motors are wired in parallel so they always operate together under normal switch operation.

## Test 1 — Existing Key Fob Harness Investigation

**Finding:** The aftermarket key fob harness taps both sides of C315 via an adapter harness. The harness uses 5 relays — 4 of which independently control PK/BK and PK/O on each side of C315 to achieve per-door independent control. This is why the "unlock driver first, second press unlocks passenger" behavior is a deliberate programmed feature, not a Ford wiring limitation.

## Test 2 — Direct Motor Drive Test

**Method:** Applied 12V from a bench power supply directly to PK/BK then PK/O at C315 with chassis ground as the return path.

**Finding:** Confirmed that applying 12V to PK/BK locks both doors and applying 12V to PK/O unlocks both doors. The existing Ford switch circuit passively provides the ground return path through G313 without needing to actively drive anything. This validated the DRV8873-Q1 direct drive approach.

**Decision driven:** Dedicated chassis ring terminal ground used on receiver board instead of relying on Ford circuit ground, since G313 is a switched ground that changes state with switch presses. Using G313 as board ground would create unstable logic and motor driver behavior.

## Test 3 — C315 Isolation Test

**Method:** Unplugged C315 completely. Powered BK/W only. Pressed passenger and driver switches while monitoring PK/BK and PK/O with a multimeter.

**Finding:** With C315 unplugged (motor side isolated from switch side), PK/BK and PK/O never received any voltage regardless of which switch was pressed. This confirmed that the motor wires are only driven THROUGH C315 and that our DRV8873 output pins are safe from back-feed when C315 is broken and our board drives the motor side directly.

**Decision driven:** This test validated Option 1 — cutting PK/BK and PK/O at C315 and routing all motor control exclusively through the receiver board. No isolation MOSFETs required.

## Test 4 — Switch Signal Behavior on PK/LG and PK/Y

**Method:** Monitored PK/LG and PK/Y on both sides of C315 during switch presses with C315 unplugged.

**Finding:**
- **Driver's side** of C315: PK/LG and PK/Y are pulled to **ground** when the driver switch is pressed (grounded through G313)
- **Passenger's side** of C315: PK/LG and PK/Y are driven to **12V** when the passenger switch is pressed (powered from the passenger switch's internal connection to BK/W)

**Decision driven:** This asymmetric behavior drove the dual input conditioning approach — driver side uses direct GPIO with 10kΩ pull-up resistor, passenger side uses a 47kΩ/22kΩ voltage divider with 3.3V Zener clamp. The firmware must account for opposite signal polarity between the two sides.

## Key Design Decisions Summary

| Decision | Reason |
|---|---|
| DRV8873-Q1 H-bridge over relay | SMD, automotive grade, independent per-door control, built-in electronic overcurrent protection |
| No isolation MOSFETs | Test 3 confirmed motor wires never back-driven with C315 adapter harness |
| No per-output fuses on motor wires | Factory 30A breaker on BK/W protects motor wiring; DRV8873 electronic protection covers the IC — same protection level as factory |
| BK/W as DRV8873 PVDD source | Keeps all motor current through factory 30A breaker, preserving original overcurrent protection chain |
| Dedicated chassis ring terminal ground | Ford G313 is a switched ground — changes state with switch presses; dedicated chassis ground gives stable board ground reference |
| Direct GPIO for driver side input | Test 4 confirmed driver side is a ground-switching signal safe for direct GPIO with 10kΩ pull-up |
| Voltage divider + Zener for passenger side input | Test 4 confirmed passenger side is a 12V-switching signal requiring conditioning to 3.3V |
| MDBT50Q-1MV2 as combined MCU + BLE | nRF52840 inside module eliminates separate MCU, FCC certified removes regulatory burden |
| TLE42744GV33ATMA1 LDO for 3.3V regulation | Automotive grade, handles 12V–16V input range, sufficient for nRF52840 + logic |
