# Test log — YYYY-MM-DD — <vehicle> — <environment>

Save as `testing/vehicle/YYYY-MM-DD-<vehicle>-<environment>.md` (e.g. `2026-11-02-mustang88-garage.md`), then add a row to [docs/compatibility.md](../../docs/compatibility.md).

## Setup

| | |
|---|---|
| Vehicle | year / make / model / lock circuit notes |
| Environment | garage / open lot / street; temp; weather; nearby RF/BLE sources |
| Receiver HW | dev rig / revA / … |
| Receiver FW | boot banner, e.g. `0.1.0 (build v0.1.0-0-g…)` |
| Fob HW | MDBT42T-DB / revA / … |
| Fob FW | boot banner |
| App | version + phone model / iOS version |
| Receiver mounting | location in car, orientation |

## Results

| # | Test | Input (app / fob / OEM switch) | Distance / fob position | Expected | Actual | Pass |
|---|---|---|---|---|---|---|
| 1 | Unlock both doors | fob | 10 ft, in hand | both unlock < 500 ms | | |
| 2 | Lock both doors | fob | 10 ft, in hand | both lock | | |
| 3 | Range | fob | step out until miss | ≥ 200 ft target | | |
| 4 | Range, fob in pocket | fob | | | | |
| 5 | App unlock / lock | app | | | | |
| 6 | OEM switch driver side | switch | — | still works | | |
| 7 | OEM switch passenger side | switch | — | still works | | |
| 8 | Repeated cycling (N×) | fob | | no faults, no heat | | |
| 9 | Phantom commands over idle period | — | — | none | | |

## Observations / issues

- 

## Follow-ups

- [ ] 
