1. Make a ratings table for the power path. List every part that main current flows through: connector, fuse, diode, switch, traces. Next to each, write its rated current and voltage, and your worst-case current and voltage. The diode issue jumps out immediately: "rated 3 A, worst case 16 A." This takes 15 minutes and is the single most valuable check.

   **Status: DONE (2026-10-22)** — except J2's per-pin rating.
   Worst case assumes each DRV8873H output is capped at ITRIP (~6.5-7 A, confirm in datasheet §6.5); both doors stalled ≈ 14 A.
   Trace capacity = IPC-2221 external, 2oz copper.

   | Path                | Part / narrowest copper                     | Rating                     | Worst case        | OK?        |
   |---------------------|---------------------------------------------|----------------------------|-------------------|------------|
   | Connector           | J2 pin 1 (12V) / pin 2 (GND)                | **unknown**                | ~14 A peak        | **VERIFY** |
   | Fuse                | F1 blade                                    | 15 A                       | ~14 A peak        | yes        |
   | Reverse-pol. diode  | D1 SL1545                                   | 15 A / 45 V                | ~14 A / 16 V      | yes        |
   | TVS                 | D2 SMBJ22A                                  | 35.5 V clamp               | load dump         | yes (BTS7004 VBAT(LD) 35 V) |
   | 12V feed traces     | 3.0 mm (2.4 mm neck, 2.4 mm long)           | ~12 A @+20°C, ~14 A @+30°C | ~14 A peak        | yes (pulsed) |
   | VM rail             | 3.0 mm + In2 plane                          | > feed                     | ~14 A             | yes        |
   | Motor outputs       | 1.2 mm (0.41 mm only at IC pins)            | ~6 A @+20°C, ~7 A @+30°C   | ~7 A              | yes (pulsed) |
   | Trunk output        | 1.0 mm strap at U5                          | ~5.4 A @+20°C              | trunk actuator    | yes if < ~5 A |
   | GND return          | In1 plane + 2.0 mm, J2.2 solid connect      | >> others                  | ~14 A             | yes        |

   - [ ] Find J2 (Molex 0367831201) per-contact current rating.
   - [ ] Firmware: stagger outputs; never fire both lock drivers + trunk at once (~19 A > 15 A fuse/D1).

2. Check every polarized part's direction. Diodes, TVS diodes, electrolytic capacitors, MOSFETs, and LEDs. For each one, ask: "Which way does current flow here, and does the symbol agree?" Your D1 and D2 were both backwards, and ERC can't catch that.

   **Status: DONE.** D1 (A from fuse, K to VM), D2 (K to VM), D5-D9 BAT54S (pin1 GND, pin2 +3.3V, pin3 signal), C20 (+ to VM), LED1 (K to GND). No MOSFETs. Still check silkscreen polarity marks on the assembled board.

3. Compare each chip against its datasheet. Look at the "Application Circuit" and "Absolute Maximum Ratings" sections. Check that every pin connects as the datasheet shows, and that nothing exceeds its max (for example, your 3.3V regulator's max input versus the TVS clamp voltage of about 24 V).

   **Status: MOSTLY DONE.** Fixed via this check: U2 pinout (SOT-23: 1 GND, 2 VOUT, 3 VIN), DRV8873H config pins (MODE/SR/nITRIP/nOL to GND, nSLEEP on GPIO), /SW_IS moved to ADC-capable P0.05, TVS vs 35-40 V maxima, IPROPI resistors 1.5k -> 470 Ω (1/1100 mirror: 7 A ≈ 3.0 V at the ADC).
   - [ ] Not yet compared line-by-line: MDBT50Q reference circuit, LR8342A recommended output cap.

4. Run KiCad's built-in checks.

ERC (Inspect → Electrical Rules Checker) catches unconnected pins and wiring mistakes in the schematic.
DRC (Inspect → Design Rules Checker) catches spacing and connection mistakes on the PCB.
Trace width calculator (Tools → Calculator Tools → Track Width): enter your current to see how wide the 16 A traces must be.

   **Status: DONE.** ERC: 0 violations. DRC: 0 errors, 0 unconnected, 0 schematic-parity issues (only cosmetic silkscreen warnings + MDBT50Q footprint-vs-library notice). Trace widths: see table in item 1.

5. Get a second set of eyes.

Export your schematic as a PDF (File → Plot, choose PDF) and upload it here. I can review the whole design at once instead of one screenshot at a time.

   **Status: DONE (Claude review).**
   - [ ] Before production: independent human EE review.

## Before / during prototype build
- [ ] Use a nylon M3 screw (or enclosure pin) in H2 — it sits ~1.2 mm from the antenna keepout.
- [ ] Tidy R23/R24 silkscreen labels (overlap).
- [ ] Generate JLCPCB fab outputs (gerbers, drill, BOM, CPL).
