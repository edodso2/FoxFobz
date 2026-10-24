# BLE Key Fob — Flutter App

## What This Is
iOS Flutter app that connects to an nRF52840 receiver over BLE and sends an unlock command.
The phone IS the key fob. One button. One BLE write. Done.

No backend. No cloud. All local BLE communication.

## Stack
- Flutter (Dart), iOS only for POC
- `flutter_blue_plus` for BLE Central operations
- No backend — all communication is local BLE

## Key Docs — Read Before Working
- **Where are we?** → `docs/ROADMAP.md`
- **Active build spec** → `docs/phase-1-app.md`
- **BLE UUIDs + payload bytes** → `../docs/protocol/ble-protocol.md`
- **Full system architecture** → `docs/ARCHITECTURE.md`
- **Open decisions** → `docs/decisions.md`

## Commands
```bash
flutter run
flutter test
flutter analyze
flutter build ios
```

## Non-Negotiable Rules
- UUIDs are NEVER hardcoded in UI or logic files — they live in `lib/constants/ble_constants.dart`
- Always check `docs/ROADMAP.md` before implementing a feature to confirm it's in scope
- BLE characteristic properties must match `../docs/protocol/ble-protocol.md` exactly — the firmware is the source of truth
- iOS BLE requires `NSBluetoothAlwaysUsageDescription` in `Info.plist` — do not remove it
- Use `writeWithResponse: true` for all unlock writes so the app knows delivery was confirmed

## References
- See `./docs/FLUTTER_BEST_PRACTICES.md` for state management conventions and widget patterns.
