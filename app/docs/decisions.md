# Open Decisions

App-level decisions that need to be made. Firmware and hardware decisions live in the main project docs.

---

## Open

### UUID Finalization

UUIDs for the Command Service and Command Characteristic are placeholders until finalized with the firmware. Once the firmware is flashed with real UUIDs, update `lib/constants/ble_constants.dart` and this doc.

**Blocked by:** firmware side deciding on final UUID values.

---

### BLE Mock Strategy for Tests

Phase 3 requires integration tests that run in CI without real hardware. The approach is to define a `BleAdapter` interface that `BleService` depends on, with a `MockBleAdapter` implementation for tests.

**Decision needed:** Where does the interface live? Options:
- `lib/services/ble_adapter.dart` (interface) + `lib/services/ble_service.dart` (real impl)
- Keep `BleService` concrete and use a test double at the provider level

---

### Reconnect Scan Strategy

When the receiver disconnects, the app needs to re-find it. Options:
- Scan for the Command Service UUID (works regardless of receiver address rotation)
- Reconnect directly to the cached device ID (faster, but may fail if address rotated)

**Recommendation:** Scan by UUID — more robust against iOS address privacy rotation.

**Decision needed:** Confirm approach when implementing Phase 3 auto-reconnect.

---

## Decided

### State Management Stack

**flutter_hooks + Riverpod** via `HookConsumerWidget`. See [FLUTTER_BEST_PRACTICES.md](FLUTTER_BEST_PRACTICES.md).

### Write Mode

`writeWithResponse: true` for all lock/unlock commands. Confirmed delivery before updating UI.

### UUID Storage

All UUIDs and payload bytes live in `lib/constants/ble_constants.dart`. Never hardcoded in UI or logic files.

### iOS Only (POC)

Android support is out of scope for the current POC phases. iOS only.

### No Backend

All communication is local BLE. No cloud, no internet, no backend required.
