# nRF52840 Production Assembly Notes

## Why We Use the Raytac MDBT50Q Module

The nRF52840 chip itself comes in a tiny package with pads on the **bottom** — impossible to hand solder and very difficult even with reflow equipment. The Raytac MDBT50Q-1MV2 module solves this by packaging the nRF52840 (plus antenna and passives) onto a small pre-built PCB with **castellated edge pads** that are much easier to work with.

Additional reasons to use the Raytac module:
- Comes **pre-certified for FCC, CE, IC, and others** — saves thousands in RF certification testing
- Nordic-recommended third-party module
- Chip antenna built in, no RF design work needed
- Just drop it into your KiCad design using their provided footprint

**Part number:** `MDBT50Q-1MV2`  
**Source:** Digi-Key (preferred), Mouser, or direct from Raytac (sales@raytac.com)

---

## Why We Outsource Assembly (JLCPCB / PCBWay)

Even though the Raytac module has castellated pads that *can* be hand soldered, outsourcing assembly is the right call because:
- Hand soldering 50+ modules is tedious and inconsistent
- RF modules are sensitive — a bad solder joint affects wireless performance
- JLCPCB/PCBWay assembly is cheap at low volumes and ensures consistent results

**Important KiCad layout rule:** The antenna area requires a **no-copper keep-out zone** on ALL layers. Follow Raytac's datasheet exactly. Raytac will review your layout for free — email them the PDF at service@raytac.com.

---

## Consigned Parts Flow (Buying Modules Separately)

JLCPCB and PCBWay may not stock the MDBT50Q-1MV2, or stock may be inconsistent. The solution is to **buy the modules yourself and ship them to the fab** — this is called consigning parts.

### Steps

1. **Order modules from Digi-Key** — order ~10% extra (e.g. 55-60 for 50 boards) to cover setup waste
2. **Photograph the packaging** — show part number + country of origin on the label (Digi-Key packaging already has this)
3. **Place your PCB + assembly order** on JLCPCB or PCBWay, selecting "consigned parts"
4. **Ship modules to the fab's warehouse** — they provide the address after you place the order
5. Fab assembles your boards with your modules

### Why Buy Your Own vs Letting the Fab Source

- Guaranteed to get the correct certified module revision
- No surprise substitutions
- More consistent across production runs

---

## Flashing Firmware (Production)

Boards arrive assembled but with no firmware. Flash via **SWD pads** on the custom board using a pogo pin jig.

### Hardware
- **Programmer:** Nordic nRF52840-DK (has on-board J-Link, can flash external targets)
- **Connection:** Pogo pin clamp (3D printed) pressing on 4-5 SWD pads on the custom board
- **Required pads:** `SWDIO`, `SWDCLK`, `GND`, `VCC` (+ optional `RESET`)
- **Pad pitch:** Use 2.54mm so standard pogo pins fit off the shelf

### Software
nRF Connect SDK (`west flash --runner jlink`)

### For Scale
The nRF52840-DK is fine for POC and first production runs (~50 units). For larger commercial runs, upgrade to a **J-Link BASE** (~$400) which has a commercial license and faster flash speeds.

---

## Quick Reference

| Item | Detail |
|---|---|
| Module | Raytac MDBT50Q-1MV2 |
| Chip | Nordic nRF52840 (ARM Cortex-M4F, BLE 5.4) |
| Dev board / programmer | Nordic nRF52840-DK (~$45 from Digi-Key, part: `NRF52840-DK`) |
| PCB fab | JLCPCB or PCBWay |
| Assembly | Outsourced SMT, consign the Raytac module |
| Flashing | SWD pads + pogo pin jig + nRF52840-DK |
| Toolchain | nRF Connect SDK (NCS), Zephyr RTOS |
