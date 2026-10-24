# Flutter Best Practices

> This document serves as a reference for Claude Code and developers working in this repository.
> It captures architectural decisions, preferred patterns, and conventions for this Flutter project.

---

## Table of Contents

- [State Management Stack](#state-management-stack)
- [Project Structure](#project-structure)
- [Widget Patterns](#widget-patterns)
- [Naming Conventions](#naming-conventions)

---

## State Management Stack

### Recommended: flutter_hooks + Riverpod

This project uses **flutter_hooks + Riverpod** as the state management stack. This is the preferred approach for developers coming from a React background and should be used consistently throughout the codebase.

| Package | Purpose | React Equivalent |
|---|---|---|
| `flutter_hooks` | Local, ephemeral, widget-scoped state | `useState`, `useEffect`, `useMemo` |
| `riverpod` | Shared state, async data, dependency injection | React Context + React Query |
| `hooks_riverpod` | Combines both via `HookConsumerWidget` | — |

### When to use flutter_hooks

Use `flutter_hooks` for **local, widget-scoped state** that does not need to be shared outside the widget:

- Local UI toggles, counters, form state
- `AnimationController` (use `useAnimationController`)
- `TextEditingController` (use `useTextEditingController`)
- `FocusNode` (use `useFocusNode`)
- Side effects tied to widget lifecycle (use `useEffect`)
- Memoized values (use `useMemoized`)

```dart
// ✅ Good — local state with hooks
class LoginForm extends HookConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emailController = useTextEditingController();
    final isLoading = useState(false);
    final focusNode = useFocusNode();

    return TextField(
      controller: emailController,
      focusNode: focusNode,
    );
  }
}
```

### When to use Riverpod

Use `Riverpod` for **shared or async state** that spans multiple widgets or needs to persist across navigation:

- User authentication state
- Remote data fetching (API calls)
- App-wide settings or preferences
- State shared between multiple widgets/screens
- Dependency injection (repositories, services)

```dart
// ✅ Good — async data with Riverpod
final userProvider = FutureProvider<User>((ref) async {
  final repo = ref.watch(userRepositoryProvider);
  return repo.getCurrentUser();
});
```

### Using Both Together: HookConsumerWidget

`HookConsumerWidget` (from `hooks_riverpod`) is the **default widget base class** for screens and complex components in this project. It gives access to both hooks and Riverpod providers in the same `build` method.

```dart
// ✅ Preferred pattern — HookConsumerWidget for screens
class ProfileScreen extends HookConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Riverpod — shared/async state
    final user = ref.watch(userProvider);

    // flutter_hooks — local UI state
    final isEditing = useState(false);
    final nameController = useTextEditingController();

    useEffect(() {
      user.whenData((u) => nameController.text = u.name);
      return null;
    }, [user]);

    return Scaffold(
      body: user.when(
        data: (u) => Text(u.name),
        loading: () => CircularProgressIndicator(),
        error: (e, _) => Text('Error: $e'),
      ),
    );
  }
}
```

### Decision Guide

```
Is the state needed outside this widget?
├── No  → flutter_hooks (useState, useEffect, etc.)
└── Yes → Is it async or from a remote source?
          ├── Yes → Riverpod FutureProvider / StreamProvider
          └── No  → Riverpod StateProvider / NotifierProvider
```

### Anti-patterns to Avoid

```dart
// ❌ Avoid — StatefulWidget for simple local state
class Counter extends StatefulWidget { ... }
class _CounterState extends State<Counter> {
  int count = 0; // use useState instead
  @override
  void initState() { ... } // use useEffect instead
  @override
  void dispose() { ... } // hooks handle this automatically
}

// ❌ Avoid — Provider package (superseded by Riverpod)
// ❌ Avoid — setState() in new widgets
// ❌ Avoid — calling hooks inside conditionals or loops (same rule as React)
```

---

## Project Structure

> _To be expanded as the project grows._

---

## Widget Patterns

> _To be expanded as the project grows._

---

## Naming Conventions

> _To be expanded as the project grows._

---

*Last updated: February 2026*
