import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'screens/home_screen.dart';

void main() {
  runApp(const ProviderScope(child: FobHubApp()));
}

class FobHubApp extends StatelessWidget {
  const FobHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fob Hub',
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueGrey)),
      home: const HomeScreen(),
    );
  }
}
