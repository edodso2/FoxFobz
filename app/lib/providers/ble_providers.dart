import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../constants/ble_constants.dart';
import '../services/ble_service.dart';

final bleServiceProvider = Provider<BleService>((ref) {
  final service = BleService();
  ref.onDispose(service.dispose);
  return service;
});

final bleConnectionStateProvider = StreamProvider<BleConnectionState>((ref) {
  final service = ref.watch(bleServiceProvider);
  return service.connectionStateStream;
});

class BleCommandNotifier extends Notifier<void> {
  @override
  void build() {}

  Future<void> unlock() async {
    await ref.read(bleServiceProvider).writeCommand(BleConstants.unlockByte);
  }

  Future<void> lock() async {
    await ref.read(bleServiceProvider).writeCommand(BleConstants.lockByte);
  }
}

final bleCommandProvider =
    NotifierProvider<BleCommandNotifier, void>(BleCommandNotifier.new);
