import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../providers/ble_providers.dart';
import '../services/ble_service.dart';

class HomeScreen extends HookConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectionAsync = ref.watch(bleConnectionStateProvider);
    final state = connectionAsync.valueOrNull ?? BleConnectionState.disconnected;
    final isConnected = state == BleConnectionState.connected;

    // Start scanning automatically on first build.
    useEffect(() {
      Future.microtask(() => ref.read(bleServiceProvider).startScan());
      return null;
    }, const []);

    final statusText = switch (state) {
      BleConnectionState.disconnected => 'Disconnected',
      BleConnectionState.scanning => 'Searching...',
      BleConnectionState.connecting => 'Connecting...',
      BleConnectionState.connected => 'Connected',
    };

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Status: $statusText',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: isConnected
                    ? () => ref.read(bleCommandProvider.notifier).unlock()
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                ),
                child: const Text(
                  'UNLOCK',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: isConnected
                    ? () => ref.read(bleCommandProvider.notifier).lock()
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                ),
                child: const Text(
                  'LOCK',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              if (state == BleConnectionState.disconnected) ...[
                const SizedBox(height: 24),
                OutlinedButton(
                  onPressed: () => ref.read(bleServiceProvider).startScan(),
                  child: const Text('SCAN'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
