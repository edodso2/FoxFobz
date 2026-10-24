# MDBT50Q-1MV2 Pin Assignments — Receiver Board

## SPI Bus (DRV8873 Motor Drivers)

| Net Label | Pin | GPIO | Description |
|---|---|---|---|
| `SPI_MOSI` | 37 | P0.13 | SPI data out to both DRV8873 drivers |
| `SPI_MISO` | 36 | P0.14 | SPI data in from both DRV8873 drivers |
| `SPI_CLK` | 39 | P0.15 | SPI clock shared between both drivers |
| `SPI_CS_DRV1` | 38 | P0.16 | Chip select — DRV8873 #1 (driver door) |
| `SPI_CS_DRV2` | 41 | P0.17 | Chip select — DRV8873 #2 (passenger door) |

## Motor Control

| Net Label | Pin | GPIO | Description |
|---|---|---|---|
| `DRV1_IN1` | 42 | P0.19 | Driver door motor — direction/enable input 1 |
| `DRV1_IN2` | 44 | P0.20 | Driver door motor — direction/enable input 2 |
| `DRV2_IN1` | 43 | P0.21 | Passenger door motor — direction/enable input 1 |
| `DRV2_IN2` | 46 | P0.22 | Passenger door motor — direction/enable input 2 |

## Fault Monitoring

| Net Label | Pin | GPIO | Description |
|---|---|---|---|
| `nFAULT` | 48 | P0.24 | Active low fault signal from DRV8873 (shared, open drain) |

## Current Sense (ADC Inputs)

| Net Label | Pin | GPIO | ADC Channel | Description |
|---|---|---|---|---|
| `DRV1_IPROPI1` | 9 | P0.03 | AIN1 | Driver door motor current sense — half bridge 1 |
| `DRV1_IPROPI2` | 10 | P0.29 | AIN5 | Driver door motor current sense — half bridge 2 |
| `DRV2_IPROPI1` | 11 | P0.02 | AIN0 | Passenger door motor current sense — half bridge 1 |
| `DRV2_IPROPI2` | 12 | P0.31 | AIN7 | Passenger door motor current sense — half bridge 2 |

## Available Pins (Reserved for Future Use)

| Pin | GPIO | Notes |
|---|---|---|
| 3–8 | P1.10–P1.15 | Low frequency I/O only — suitable for buttons, LEDs, switch inputs |
| 13 | P0.28 / AIN4 | Analog capable |
| 14 | P0.30 / AIN6 | Analog capable |
| 19 | P0.26 | General purpose |
| 22 | P0.06 | General purpose |
| 23 | P0.07 | General purpose |
| 24 | P0.08 | General purpose |
| 25 | P1.08 | General purpose |
| 26 | P1.09 | Low frequency only |
| 48 | P0.24 | General purpose |
| 49 | P0.25 | General purpose |

## Notes
- **P1.xx pins** are standard drive, low frequency I/O only — do not use for SPI or high speed signals
- **AIN pins** must be used for IPROPI current sense inputs (analog)
- **nFAULT** is open-drain — requires 10kΩ pullup to 3.3V (already on schematic)
- SPI bus (MOSI/MISO/CLK) is shared between both DRV8873 drivers — only CS lines are unique per chip
