# Hardware — notes for Claude

- KiCad 10. The full receiver workflow (Freerouting loop, pcbnew scripting, DRC gotchas, fab outputs) is in [receiver/CLAUDE.md](receiver/CLAUDE.md). It applies to the fob board too.
- **Close the project in KiCad before editing `.kicad_*` files directly**, or KiCad's next save clobbers the edit. Ask the user if unsure (`~*.lck` files present = open).
- The schematic is the pinout source of truth. `receiver/docs/early-pin-plan.md` and `early-bom.csv` are pre-schematic and stale.
- Revisions/releases: see [README.md](README.md#revisions-and-releases). Don't create `*-hw/rev*` tags yourself. The user tags when an order is placed.
- Never commit `fab_outputs/`, `*-backups/`, `fp-info-cache`, `.dsn`/`.ses` (ignored). Release snapshots go in `<board>/releases/revX/`.
