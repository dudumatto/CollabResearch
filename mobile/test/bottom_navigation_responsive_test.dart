import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/app.dart';
import 'package:tcc_mobile/models/user.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';

class _AuthenticatedAuthProvider extends AuthProvider {
  _AuthenticatedAuthProvider() {
    token = 'header.payload.signature';
    currentUser = const User(
      id: 'navigation-test-user',
      name: 'Usuário Teste',
      email: 'usuario@example.com',
    );
  }

  @override
  Future<void> checkAuth() async {
    notifyListeners();
  }
}

void main() {
  for (final width in [320.0, 480.0]) {
    testWidgets('bottom navigation não transborda em ${width.toInt()} px',
        (tester) async {
      await tester.binding.setSurfaceSize(Size(width, 800));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      final auth = _AuthenticatedAuthProvider();
      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: auth,
          child: TccMobileApp(authProvider: auth),
        ),
      );
      await tester.pump(const Duration(milliseconds: 600));

      expect(
        find.byKey(const Key('mobile-navigation-selected-0')),
        findsOneWidget,
      );
      expect(_navigationItems(), findsNWidgets(6));
      expect(tester.takeException(), isNull);

      final navigationBar = tester.getRect(
        find.byKey(const Key('mobile-navigation-selected-0')),
      );
      expect(navigationBar.width, lessThanOrEqualTo(width));

      await tester.tap(_navigationDestination('Início'));
      await tester.pump(const Duration(milliseconds: 220));

      expect(
        find.byKey(const Key('mobile-navigation-selected-0')),
        findsOneWidget,
      );
      expect(tester.takeException(), isNull);
    });
  }
}

Finder _navigationDestination(String label) {
  return find.byKey(ValueKey('mobile-navigation-$label'));
}

Finder _navigationItems() {
  return find.byWidgetPredicate(
    (widget) =>
        widget.key is ValueKey<String> &&
        (widget.key! as ValueKey<String>)
            .value
            .startsWith('mobile-navigation-') &&
        !(widget.key! as ValueKey<String>).value.contains('selected'),
  );
}
