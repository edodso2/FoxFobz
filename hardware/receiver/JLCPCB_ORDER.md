# JLCPCB Order Settings

Only settings that differ from JLCPCB's defaults are listed. Leave everything else at the default.

## Files to upload (from `fab_outputs/`)

| Step | File |
|---|---|
| Gerber | `FoxFobz_Reciever_gerbers.zip` |
| BOM | `FoxFobz_Reciever_BOM_JLCPCB.csv` |
| Placement (CPL) | `FoxFobz_Reciever_CPL_JLCPCB.csv` |

## PCB: change from default

| Setting | Default | Set to |
|---|---|---|
| Surface Finish | HASL (with lead) | **LeadFree HASL** (or ENIG) |
| Outer Copper Weight | 1 oz | **2 oz** |
| Inner Copper Weight | 0.5 oz | **1 oz** |

Confirm after uploading the gerbers: Layers = **4**, size ≈ **87.7 × 52 mm**.

## PCBA: change from default

| Setting | Default | Set to |
|---|---|---|
| Confirm Parts Placement | No | **Yes** (check J2 orientation especially) |
| Photo Confirmation | No | **Yes** |

Also confirm:
- **Standard PCBA** with **through-hole assembly** for **F1** (fuse holder) and **J2** (Molex 39-30-1120).
- **Assembly side:** Top.

## Buy separately (not on the BOM)

- 15 A **mini** blade fuse (ATM size, not standard ATO/ATC) for F1. The Keystone 3568 holder takes mini blades.

## Pre-order before placing the order

| Part | LCSC | Qty |
|---|---|---|
| MDBT50Q-1MV2 BLE module (U1) | C5118826 | 1 per board + 1 spare |
| Keystone 3568 fuse holder (F1) | C5249699 | 1 per board + 1 spare |
- Molex Mini-Fit Jr. 12-circuit receptacle **39-01-2120**, plus crimp terminals. Use HCS terminals with 16 AWG for the 12 V, GND and motor wires.
