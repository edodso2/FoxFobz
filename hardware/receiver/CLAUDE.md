# FoxFobz Receiver — working notes for Claude

BLE-triggered dual door-lock actuator driver: MDBT50Q (nRF52) BLE module (U1),
two TI DRV8873 dual-H-bridge motor drivers (U3/U4) driving door lock actuators,
powered from a car's 12V harness through a Molex connector (J2), fuse (F1), and
reverse-polarity/surge protection diodes (D1/D2). Some wire pairs on J2 are also
read back (voltage divider + clamp) to sense the car's existing OEM lock
commands. 2-layer board, 2oz copper, no enclosure size constraint beyond
"compact." Git-tracked; commit after every verified change so bad iterations
are cheap to revert.

## How this project likes to work

This board got routed through many iterative cycles of: user adjusts
component placement in KiCad → Claude runs Freerouting → Claude imports the
result → Claude runs the *real* DRC (kicad-cli, not eyeballing) → report back
precisely what's still broken → repeat. That loop is the core workflow —
trust it over trying to one-shot a finished layout.

The user does **not** want to drive the DSN/SES/DRC mechanics by hand —
that entire loop (export DSN, run Freerouting, import the session, refill
zones, run DRC, report) is scriptable and Claude should just do it (see
"Running Freerouting headlessly" below; the old assumption that the DSN/SES
round-trip needed the KiCad GUI was wrong). What the user actually wants to
stay hands-on for is **placement and copper-shape judgment calls** — moving/
rotating/spacing components, or hand-tracing a plane's outline when the
auto-generated shape "looks crappy" or a simpler split would be cleaner.
Expect them to jump in on the `.kicad_pcb` between Claude's automated rounds
for exactly that kind of visual/spatial call, then hand it back with "check
this" — always re-verify with real DRC after, don't assume a manual edit is
correct just because it was intentional.

- **KiCad file-clobber gotcha (important)**: if KiCad has the project open,
  its in-memory state will silently overwrite any file edit Claude makes the
  next time KiCad saves anything — including net class changes made by
  editing `.kicad_pro` directly. Before Claude edits `.kicad_pcb`/`.kicad_pro`
  directly, confirm the project is **closed** in KiCad. After Claude edits it,
  the user must reopen/reload before touching KiCad again, or their next save
  will stomp the edit.
- Moving a footprint in KiCad does **not** drag its existing copper with it —
  traces/vias stay at the old coordinates and become geometrically orphaned.
  After any component move, locked escape stubs / hand-routed segments near
  that component need to be found (by position, not net name — see below) and
  rebuilt at the new location.
- The user is comfortable doing hands-on layout work themselves (moving,
  rotating, repositioning components; finishing a stubborn connection with
  KiCad's interactive router) — Claude doesn't need to solve everything by
  blind coordinate search. When a spot is genuinely too congested for a
  scripted clearance search (tried and failed with multiple candidates/radii),
  say so plainly and hand it off rather than grinding — KiCad's push-and-shove
  interactive router can nudge existing traces in ways a rigid "does this gap
  already exist" search cannot.
- Net codes can get renumbered by a KiCad save. Orphaned/disconnected copper
  can end up showing a stale, misleading net name after that. When identifying
  old copper to remove after a component move, match by **position**, not by
  trusting the net name shown on disconnected tracks.
- Ground answers in the actual datasheet, not general PCB folklore, when the
  question is about a specific part (e.g. whether both VM pins on the
  DRV8873 need to be connected — checked TI's layout guidelines, which say
  "each VM pin must be bypassed," not optional).

## Running Freerouting headlessly (the autorouter)

KiCad has no built-in autorouter, and `kicad-cli` genuinely cannot
export/import Specctra DSN/SES — but **the DSN/SES round-trip is not
GUI-only**, despite what an earlier version of this file said. It's
missing from `kicad-cli` specifically, but exposed in the bundled `pcbnew`
Python scripting module:

```python
import pcbnew
board = pcbnew.LoadBoard("FoxFobz_Reciever.kicad_pcb")
pcbnew.ExportSpecctraDSN(board, "FoxFobz_Reciever_roundN.dsn")   # -> bool
# ...run Freerouting on the .dsn, producing a .ses...
board = pcbnew.LoadBoard("FoxFobz_Reciever.kicad_pcb")            # reload
pcbnew.ImportSpecctraSES(board, "FoxFobz_Reciever_roundN.ses")   # -> bool
pcbnew.SaveBoard("FoxFobz_Reciever.kicad_pcb", board)
```

Both return `True`/`False`; a real DRC pass afterward is still the actual
gate (see below), not the boolean. This means Claude can run the entire
export → route → import → DRC loop itself with **zero GUI steps** — the
user never needs to touch File → Export/Import for this. (`pcbnew.LoadBoard`
prints a harmless `assert "traits" failed... create wxApp before calling
this` warning to stderr when run outside the KiCad GUI event loop — ignore
it, it doesn't affect correctness.)

**Re-running Freerouting on a DSN re-exported from a partially-routed
board is not a safe "top-up" operation** — it can rip up existing good
routing and net-regress instead of closing the remaining gaps. Confirmed
on this board: round 1 (fresh unrouted DSN) left 7 unrouted connections;
exporting a fresh DSN from that state and running Freerouting again left
11, including three nets that round 1 had fully closed. Always diff the
new unrouted-net list against the previous round's before importing —
don't assume "ran it again" is strictly additive progress. Discarding a
regressed round and keeping the previous `.kicad_pcb` commit is a normal,
expected outcome, not a failure to work around.

Freerouting jar lives at `~/Applications/freerouting/freerouting-2.4.1.jar`
(downloaded from GitHub releases). It needs a newer JVM than whatever ships
by default — installed via `brew install openjdk@25`, invoked explicitly
since it's keg-only:

```
JAVA=/opt/homebrew/opt/openjdk@25/bin/java
"$JAVA" -Djava.awt.headless=true -jar ~/Applications/freerouting/freerouting-2.4.1.jar \
  -de FoxFobz_Reciever.dsn \
  -do FoxFobz_Reciever_roundN.ses \
  -mp 40 -mt 1
```

Two flags that aren't optional:
- **`-Djava.awt.headless=true`** — without it, Freerouting still tries to spin
  up AWT/Swing rendering even in CLI mode, which throws a NullPointerException
  on this board's copper (zone/plane rendering) and can produce a corrupt
  0-byte `.ses` output.
- **`-mt 1`** — Freerouting's own startup log warns that multi-threaded route
  optimization is buggy and generates clearance violations; it says so
  explicitly ("use `-mt 1`"). Believe it — a `-mt 12` run produced worse
  results than `-mt 1` on identical input.

After every import: **always refill zones before trusting DRC output.**
A stale zone fill vs. newly-imported copper produces hundreds of bogus
"clearance violation" results that vanish once refilled:

```
kicad-cli pcb drc --refill-zones --save-board --severity-error --severity-warning \
  -o /tmp/drc.json --format json FoxFobz_Reciever.kicad_pcb
```

Freerouting is not fully deterministic across re-runs on the same file, but
running it again on the *exact same* DSN twice in a row will produce
identical output (down to the byte) — if a rerun doesn't help, more `-mp`
passes won't either; that's Freerouting hitting a real limit, not needing
more time. The fix that actually moved the needle across this project was
almost always **layout changes** (more spacing between components, especially
around tightly-packed IC pin escapes), not router tuning.

## Scripting layers and copper-pour zones with pcbnew Python

Converting the 2-layer board to 4 layers and adding/reshaping GND/power
plane zones was all done via `pcbnew` scripting, not the KiCad GUI dialogs.
Worth knowing before doing it again (on this board or a future one):

- **KiCad's copper layer IDs are fixed, not sequential by stack position**:
  `F.Cu`=0, `B.Cu`=2 always, then `In1.Cu`=4, `In2.Cu`=6, ... regardless of
  total layer count. Don't hand-guess these in a `.kicad_pcb` layers table —
  generate a throwaway reference board (`pcbnew.BOARD()`,
  `board.GetDesignSettings().SetCopperLayerCount(4)`, `pcbnew.SaveBoard(...)`)
  and read back its `(layers ...)` block instead of guessing.
- `pcbnew.BOARD_STACKUP`/`BOARD_STACKUP_ITEM` are **not exposed to Python**
  (`board.GetDesignSettings().GetStackupDescriptor()` returns an opaque,
  unusable `SwigPyObject`) — the physical stackup (dielectric thicknesses,
  prepreg/core materials) has to be hand-written into the `.kicad_pcb`
  `(stackup ...)` block directly. Precision here mostly only matters for the
  3D view and impedance modeling, not DRC — a reasonable standard JLCPCB-like
  construction (2oz outer, 1oz inner, ~0.2mm prepreg, core sized to hit a
  sane total thickness) is good enough absent an actual impedance-controlled
  net on this board.
- **Creating a `pcbnew.ZONE`**: `zone.SetLayer(pcbnew.In1_Cu)`,
  `zone.SetNetCode(board.FindNet(name).GetNetCode())`, build the outline via
  `zone.Outline().NewOutline()` + repeated `.Append(FromMM(x), FromMM(y))`,
  then `board.Add(zone)`. For an internal plane reached only through via
  barrels (never hand-soldered), use
  `zone.SetPadConnection(pcbnew.ZONE_CONNECTION_FULL)` — solid connect, not
  thermal-relief spokes; spokes only matter for solderability on outer
  layers.
- **Removing a zone and adding new ones in the same Python process produced
  a broken `FindNet()` result** (`AttributeError: 'SwigPyObject' object has
  no attribute 'GetNetCode'`, plus a "memory leak of type 'ZONE *'" warning)
  — something about `board.Remove(zone)` leaves the net table in a state
  where a subsequent `FindNet()` in that *same* process returns an
  improperly-wrapped object. Fix: do the removal + save in one `python3.9`
  invocation, then a fresh `LoadBoard()` in a second invocation to add the
  new zones. Annoying but reliable.
- **Two same-net zones that physically overlap on the same layer are legal
  copper-wise (no short — it's one net) but KiCad's DRC still errors on it**
  as `zones_intersect`: "intersecting zones must have distinct priorities."
  Fix is `zone.SetAssignedPriority(n)` with different values, not reshaping
  the copper. Don't mistake this error for a short — check the net names in
  the violation before panicking.
- **`zone.GetLayerName()` (and possibly other zone getters) can report a
  stale/wrong value in-process right after a script-driven edit** — it
  printed `F.Cu` for a zone that the saved file correctly had on `In1.Cu`.
  Don't trust a Python getter called immediately post-mutation; verify
  against the raw saved file (`grep -A2 '(zone' file.kicad_pcb`) or a fresh
  `LoadBoard()` in a new process instead.
- **A footprint's own keepout zones (e.g. the MDBT50Q antenna clearance
  polygons baked into the `RF_Module:Raytac_MDBT50Q` footprint) are defined
  for specific layers** (`F.Cu` and `F.Cu`+`B.Cu` in the 2-layer-era
  footprint) **and don't automatically extend to new layers** when the
  board's layer count changes. Adding `In1.Cu`/`In2.Cu` to a plane pour
  without also adding them to that footprint's keepout `(layers ...)` list
  would let a plane sit directly under the antenna. Check
  `grep -n "keepout" -A2 *.kicad_pcb` after any layer-count change involving
  an RF module.

## Verifying geometry with a Python pre-check before writing to the board

Useful for planning hand-routed traces/vias before committing to them, using
KiCad's own pcbnew module directly (bundled with KiCad, not pip):

```
PY=/Applications/KiCad/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3.9
```

Two real bugs got found the hard way while building this kind of checker —
worth not repeating:
1. **Approximating a pad as 5 sample points (center + 4 corners) misses the
   true nearest point when it falls along the middle of a wide pad's edge.**
   Use the pad's actual (rotation-aware) `GetBoundingBox()` and compute true
   point-to-rectangle distance (dense sampling along the candidate segment
   against the clamped-to-rect point), not corner-only sampling.
2. **When placing multiple new vias in one batch, check each new candidate
   against the others already picked in that same batch**, not only against
   the pre-existing board — otherwise two new vias can land closer together
   than the drill-to-drill minimum and only the real DRC catches it.
3. **A scratch copy used for a pre-check needs its matching `.kicad_pro`
   alongside it, or `kicad-cli pcb drc` silently falls back to different
   design-rule defaults** (seen: it invented a phantom 0.2mm minimum track
   width and flagged 28 real, intentional 0.15mm Freerouting fanout stubs
   that don't violate anything in the actual project, which sets
   `min_track_width: 0.0`). If a scratch-copy DRC run reports violations
   that don't reproduce on the real project files, check for this before
   trusting the result — `cp board.kicad_pcb board.kicad_pro scratch/`, not
   just the `.kicad_pcb`.

Either way: **the Python pre-check is a fast filter, never the final answer.**
Always follow it with a real `kicad-cli pcb drc` pass before considering
anything committed — that's the actual gate, and it caught all three issues
above before they reached a commit.

## Fab outputs (JLCPCB)

- Gerbers: `kicad-cli pcb export gerbers` — layer names in this file use the
  legacy short form (`F.SilkS`/`B.SilkS`, not `F.Silkscreen`) — check
  `grep '(layer "' *.kicad_pcb` if unsure before an export silently omits a
  layer. Use `--subtract-soldermask --check-zones`, default Protel-style
  extensions (don't pass `--no-protel-ext`).
- Drill: `kicad-cli pcb export drill --excellon-separate-th --generate-map --generate-report`.
- BOM: `kicad-cli sch export bom --fields "Value,Reference,Footprint,LCSC" --group-by "Value,Footprint,LCSC"`
  — this project's schematic symbols already carry LCSC part numbers in an
  `LCSC` field, so the BOM comes out assembly-ready with no manual lookup.
  JLCPCB's exact header for that column is `JLCPCB Part #（optional）` — note
  the full-width parentheses, not ASCII.
- CPL/position file: `kicad-cli pcb export pos --format csv --units mm --side both`,
  then reformat to JLCPCB's exact columns (`Designator, Mid X, Mid Y, Layer, Rotation`,
  coordinates as `"12.3456mm"` strings, Layer as `Top`/`Bottom`, rotation
  normalized to 0-360).
- Check pad attributes (`pad.GetAttribute() == pcbnew.PAD_ATTRIB_PTH`) before
  assuming everything is SMT-assembleable — this board has two through-hole
  parts (fuse holder, main connector) that need JLCPCB's THT assembly add-on,
  not just standard SMT.
