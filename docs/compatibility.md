# Compatibility & Tested Combinations

Each component is versioned on its own (see [Versioning](../README.md#versioning)). This file records **which combinations have actually been tested together**. Field-test sign-off (M5) is judged against this table.

## Protocol versions

| Protocol | Fob packet version byte | GATT | Receiver FW | Fob FW | App |
|---|---|---|---|---|---|
| `protocol/v1` | `0x01` | 1-byte command, no auth | ≥ 0.1.0 | ≥ 0.1.0 | 1.0.0+1 |

## Tested combinations

Add a row whenever a test session in `testing/` passes or fails. Link the log.

| Date | Receiver HW | Receiver FW | Fob HW | Fob FW | App | Vehicle | Result | Log |
|---|---|---|---|---|---|---|---|---|
| | dev rig (MDBT50Q-DB-40 + DRV8873 breakouts) | v0.1.0 | MDBT42T-DB | v0.1.0 | 1.0.0+1 | 1988 Mustang | | |
