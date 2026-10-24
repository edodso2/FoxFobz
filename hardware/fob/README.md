# Fob board

The KiCad project goes here (`FoxFobz_Fob.kicad_pro`). Create it in this folder with project-local libraries (`${KIPRJMOD}`), the same way as [../receiver/](../receiver/).

## Requirements

- **Module:** Raytac **MDBT42TV-PAT** (nRF52805), FCC pre-certified ([decision 0003](../../docs/decisions/0003-mdbt42t-fob.md))
- **Power:** CR2032 coin cell holder, with a 100 mA polyfuse on the battery line
- **Buttons:** 2 tactile buttons, unlock and lock. A long press (≥ 3 s) on either is the pairing-authorization signal ([security.md](../../docs/security.md)). Consider footprints for the 2 reserved buttons.
- **Status LED** with a high-value series resistor to protect the battery; used for pairing feedback
- **SWD test pads** (SWDIO, SWDCLK, GND, VCC, RESET) at 2.54 mm pitch for the pogo-pin provisioning jig, on the board interior (can be conformal-coated after production)
- **Size:** ≤ 35 × 25 mm, to fit an off-the-shelf key fob enclosure (enclosure TBD; pick it before layout)
- **Battery life:** sleep current target < 5 µA. Avoid always-on dividers and pull-ups.

Pins the firmware uses today ([overlay](../../firmware/fob/boards/nrf52dk_nrf52805.overlay)): P0.04 unlock, P0.05 lock, P0.12 / P0.14 reserved. Buttons go from pin to GND with internal pull-ups. Avoid P0.21 (nRESET) and P0.00/P0.01 (32.768 kHz crystal).

## KiCad checklist

- [ ] Import the MDBT42TV-PAT symbol/footprint/3D model into a local `.pretty`
- [ ] Antenna keep-out per the Raytac datasheet on **all** copper layers; no pour under the antenna
- [ ] CR2032 holder footprint matched to the chosen enclosure
- [ ] Button footprints (2 + reserved), status LED + resistor
- [ ] 100 mA polyfuse on the battery line
- [ ] SWD pads at 2.54 mm pitch, interior placement
- [ ] Silkscreen: "Contains FCC ID: …" for the MDBT42T, plus board rev (`revA`)
- [ ] Title block Rev set; outline ≤ 35 × 25 mm
- [ ] ERC/DRC clean (`kicad-cli`), then release per [../README.md](../README.md#revisions-and-releases)
- [ ] Optional: send the layout PDF to Raytac for a free review (service@raytac.com)
