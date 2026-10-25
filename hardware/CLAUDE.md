# Hardware — notes for Claude

- KiCad 10. The full receiver workflow (Freerouting loop, pcbnew scripting, DRC gotchas, fab outputs) is in [receiver/CLAUDE.md](receiver/CLAUDE.md). It applies to the fob board too.
- **Close the project in KiCad before editing `.kicad_*` files directly**, or KiCad's next save clobbers the edit. Ask the user if unsure (`~*.lck` files present = open).
- The schematic is the pinout and BOM source of truth (LCSC part numbers are in the symbols' `LCSC` field).
- Library paths must be portable: stock 3D models via `${KICAD10_3DMODEL_DIR}`, everything else vendored in the project (`${KIPRJMOD}/<part>.pretty/` or `${KIPRJMOD}/3dmodels/`) and listed in `sym-lib-table`/`fp-lib-table`. Never use absolute paths. Missing parts can be regenerated from LCSC with `~/Development/easy_eda_converter` (`uv run convert.py <LCSC#> --output <scratch>/jlc`), then copied in.
- Revisions/releases: see [README.md](README.md#revisions-and-releases). Don't create `*-hw/rev*` tags yourself. The user tags when an order is placed.
- Never commit `fab_outputs/`, `*-backups/`, `fp-info-cache`, `.dsn`/`.ses` (ignored). Release snapshots go in `<board>/releases/revX/`.
