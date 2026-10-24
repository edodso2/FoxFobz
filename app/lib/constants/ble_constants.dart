// BLE UUIDs and payload bytes for the fob hub protocol.
// These values must match the firmware on the nRF52840 receiver.
// Update the UUID strings below to match your device's advertised values.
abstract final class BleConstants {
  // Service UUID advertised by the receiver.
  static const String commandServiceUuid = '46F00001-4200-4C45-9876-ABCDEF000000';

  // Write-with-response characteristic that accepts lock/unlock commands.
  static const String commandCharacteristicUuid = '46F00002-4200-4C45-9876-ABCDEF000000';

  // Payload bytes — must match firmware command handler.
  static const int unlockByte = 0x01;
  static const int lockByte = 0x02;
}
