# Backlog

Ideas parked until after the product passes field testing (M5). Nothing here is planned yet. Move an item into [STATUS.md](../STATUS.md) or the [roadmap](roadmap.md) when it gets picked up.

## Product features

- **Battery monitoring:** fob reports battery level to the app; low-battery notification.
- **Activity log:** timestamped history of which device locked/unlocked and when.
- **Named devices:** "John's fob", "Jane's fob", with per-device activity.
- **More buttons/outputs:** trunk, hazard, horn. The fob has 2 reserved button pins (P0.12, P0.14); the receiver has a trunk output. An add-on hazard (10 A) / horn (20 A) output from a separate fused battery feed was sketched.
- **Smart-switch diagnostics:** receiver reads the smart switches and reports faults to the app.
- **Configurable motor run time** from the app, saved to flash.
- **Time-based access schedules:** only allow commands during set hours or days.
- **Double-tap / long-press gestures** for extra commands from one button.
- **OTA firmware updates** for fob and receiver through the app (needs MCUboot slots; see [security.md](security.md#firmware-integrity--decided)).
- **Tamper alerts:** app notified if an output fires without an authorized device in range.
- **NFC tap-to-pair:** receiver only. The nRF52805 fob has no NFC.
- **Cloud sync / fleet monitoring:** phone bridges BLE to a backend. This is a big change: today it's "no backend" by design.

## App

- Android support (iOS only today)

## Not doing

- **Proximity / RSSI auto-unlock:** relay-attack risk ([decision 0005](decisions/0005-no-proximity-auto-unlock.md)).
