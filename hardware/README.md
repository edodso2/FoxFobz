# Hardware

KiCad **10.0** projects, one folder per board.

| Board | Folder | Current rev | Status |
|---|---|---|---|
| Receiver (MDBT50Q-1MV2, 2× DRV8873H, 12 V harness) | [receiver/](receiver/) | revA (unreleased) | Designed, DRC/ERC clean, fab outputs generated. Order pending car test (M2) |
| Fob (MDBT42TV-PAT, CR2032, 2 buttons) | [fob/](fob/) | — | Not started (M3) |
| Dev rig (breadboard + breakouts) | [dev-rig/](dev-rig/) | — | In use for car testing (M1) |

## Revisions and releases

A board **revision** (A, B, C…) is a set of boards that was actually ordered. Edits between orders are just commits.

When placing a JLC order:
1. Set the schematic and PCB title block **Rev** to the letter, and put `revX` on the silkscreen.
2. Run ERC/DRC (`kicad-cli`) and regenerate fab outputs (see [receiver/CLAUDE.md](receiver/CLAUDE.md#fab-outputs-jlcpcb)).
3. Copy exactly what you upload into `<board>/releases/revX/`: gerbers zip, BOM, CPL, a schematic PDF, and the JLC order settings used. This folder is committed. `fab_outputs/` (scratch) stays ignored.
4. Commit, then tag: `git tag -a receiver-hw/revA -m "Receiver revA — JLC order #…"`.
5. Update [STATUS.md](../STATUS.md) and [docs/compatibility.md](../docs/compatibility.md).

Board bring-up and test results go in `testing/`. Problems found on a revision go in that board's `TODO.MD` as next-rev candidates.

## Libraries

Each project keeps its own part libraries (`*.pretty` folders with symbol + footprint + 3D model), referenced through `${KIPRJMOD}` so the folder can move. If the fob reuses receiver parts, move them to `hardware/lib/` and point both projects' lib tables at `${KIPRJMOD}/../lib/...`.
