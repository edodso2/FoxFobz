// BLE UUIDs and payload bytes for the fob hub protocol.
// Mirrors firmware/common/include/foxfobz/protocol.h (the source of truth);
// spec: docs/protocol/ble-protocol.md. Change all three together.
abstract final class BleConstants {
  // Service UUID advertised by the receiver.
  static const String commandServiceUuid = '46F00001-4200-4C45-9876-ABCDEF000000';

  // Write-with-response characteristic that accepts lock/unlock commands.
  static const String commandCharacteristicUuid = '46F00002-4200-4C45-9876-ABCDEF000000';

  // Payload bytes — must match firmware command handler.
  static const int unlockByte = 0x01;
  static const int lockByte = 0x02;
}
