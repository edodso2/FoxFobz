# Dev rig (car testing)

Breadboard setup used on the car before the custom boards exist (M1):

- **Receiver:** Raytac MDBT50Q-DB-40 + DRV8873 motor-driver breakout boards, wired to match the production receiver pins where possible:
  - P0.04 nSLEEP (shared)
  - P0.19 / P0.20 driver-side EN/IN1 (PWM1 ch0) / PH/IN2
  - P0.21 / P0.22 passenger-side EN/IN1 (PWM1 ch1) / PH/IN2
  - P1.06 hardwired-unlock input (pull to GND)
  - See the [overlay](../../firmware/receiver/boards/raytac_mdbt50q_db_40_nrf52840.overlay) and [main.c](../../firmware/receiver/src/main.c).
- **Fob:** Raytac MDBT42T-DB, buttons on P0.04 (unlock) and P0.05 (lock) to GND.
- **Programmer:** nRF52840-DK as J-Link, SWD at 500 kHz.

TODO: wiring diagram/photos of the current rig, car-side connections (C315, ground point), power source.
