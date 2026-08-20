import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:tcc_mobile/core/api/api_client.dart';
import 'package:tcc_mobile/core/api/api_endpoints.dart';
import 'package:tcc_mobile/providers/auth_provider.dart';
import 'package:tcc_mobile/screens/auth/login_screen.dart';

void main() {
  testWidgets('exibe campos de login', (tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    expect(find.text('Entrar'), findsWidgets);
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Senha'), findsOneWidget);
  });

  test('exibe mensagem especifica para credenciais invalidas no login', () {
    final error = DioException(
      requestOptions: RequestOptions(path: ApiEndpoints.login),
      response: Response(
        requestOptions: RequestOptions(path: ApiEndpoints.login),
        statusCode: 401,
      ),
    );

    expect(ApiClient.instance.friendlyError(error), 'Credenciais invalidas.');
  });
}
