import 'dart:async';

import 'package:flutter_blue_plus/flutter_blue_plus.dart';

import '../constants/ble_constants.dart';

enum BleConnectionState {
  disconnected,
  scanning,
  connecting,
  connected,
}

class BleService {
  BluetoothDevice? _device;
  BluetoothCharacteristic? _commandCharacteristic;
  StreamSubscription<List<ScanResult>>? _scanSubscription;
  StreamSubscription<BluetoothConnectionState>? _connectionSubscription;
  bool _isConnecting = false;

  BleConnectionState _currentState = BleConnectionState.disconnected;
  BleConnectionState get currentState => _currentState;

  final _stateController =
      StreamController<BleConnectionState>.broadcast();

  Stream<BleConnectionState> get connectionStateStream =>
      _stateController.stream;

  Future<void> startScan() async {
    if (_isConnecting || _currentState == BleConnectionState.connected) return;

    _isConnecting = false;
    _emit(BleConnectionState.scanning);

    try {
      _scanSubscription = FlutterBluePlus.scanResults.listen((results) {
        if (_isConnecting || results.isEmpty) return;
        _isConnecting = true;
        _connectToDevice(results.first.device);
      });

      await FlutterBluePlus.startScan(
        withServices: [Guid(BleConstants.commandServiceUuid)],
      );
    } catch (_) {
      _emit(BleConnectionState.disconnected);
    }
  }

  Future<void> _connectToDevice(BluetoothDevice device) async {
    await FlutterBluePlus.stopScan();
    await _scanSubscription?.cancel();
    _scanSubscription = null;

    _emit(BleConnectionState.connecting);

    try {
      await device.connect();
      _device = device;

      _connectionSubscription = device.connectionState.listen((state) {
        if (state == BluetoothConnectionState.disconnected) {
          _commandCharacteristic = null;
          _device = null;
          _isConnecting = false;
          _emit(BleConnectionState.disconnected);
        }
      });

      final services = await device.discoverServices();
      BluetoothCharacteristic? found;

      for (final service in services) {
        if (service.serviceUuid == Guid(BleConstants.commandServiceUuid)) {
          for (final char in service.characteristics) {
            if (char.characteristicUuid ==
                Guid(BleConstants.commandCharacteristicUuid)) {
              found = char;
              break;
            }
          }
          break;
        }
      }

      if (found != null) {
        _commandCharacteristic = found;
        _emit(BleConnectionState.connected);
      } else {
        await device.disconnect();
        _isConnecting = false;
        _emit(BleConnectionState.disconnected);
      }
    } catch (_) {
      _isConnecting = false;
      _emit(BleConnectionState.disconnected);
    }
  }

  Future<void> writeCommand(int byte) async {
    final char = _commandCharacteristic;
    if (char == null) return;
    await char.write([byte], withoutResponse: false);
  }

  Future<void> disconnect() async {
    await _device?.disconnect();
  }

  void _emit(BleConnectionState state) {
    _currentState = state;
    _stateController.add(state);
  }

  void dispose() {
    _scanSubscription?.cancel();
    _connectionSubscription?.cancel();
    _stateController.close();
  }
}
