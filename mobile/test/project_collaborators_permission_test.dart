import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/core/api/api_client.dart';
import 'package:tcc_mobile/providers/project_provider.dart';

/// O backend responde 200 no projeto e 403 apenas em /colaboradores quando
/// quem pede nao participa dele. Este adaptador devolve o status pedido.
class _StatusAdapter implements HttpClientAdapter {
  _StatusAdapter(this.status);

  final int status;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    if (status == 200) {
      return ResponseBody.fromString(
        jsonEncode([]),
        200,
        headers: {
          Headers.contentTypeHeader: [Headers.jsonContentType],
        },
      );
    }

    return ResponseBody.fromString(
      jsonEncode({
        'code': status == 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR',
        'message': status == 403
            ? 'Sem permissao para consultar a equipe deste projeto'
            : 'Erro interno',
        'status': status,
      }),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  late HttpClientAdapter original;

  // O interceptor do ApiClient le o token do flutter_secure_storage antes de
  // cada request; sem simular o canal de plataforma a chamada nunca resolve.
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('plugins.it_nomads.com/flutter_secure_storage'),
      (call) async => call.method == 'read' ? null : <String, String>{},
    );
    original = ApiClient.instance.dio.httpClientAdapter;
  });

  tearDown(() {
    ApiClient.instance.dio.httpClientAdapter = original;
  });

  test('403 na equipe nao vira aviso de erro na tela', () async {
    ApiClient.instance.dio.httpClientAdapter = _StatusAdapter(403);
    final provider = ProjectProvider();

    await provider.loadCollaborators('2');

    // Sem isto, o aluno abria um projeto aberto -- que ele pode ver -- e
    // recebia a faixa "Voce nao tem permissao para esta acao".
    expect(provider.errorMessage, isNull);
    expect(provider.collaboratorsFor('2'), isEmpty);
  });

  test('uma falha de verdade continua avisando', () async {
    ApiClient.instance.dio.httpClientAdapter = _StatusAdapter(500);
    final provider = ProjectProvider();

    await provider.loadCollaborators('2');

    expect(provider.errorMessage, isNotNull);
  });

  test('quem pode ver a equipe recebe a lista', () async {
    ApiClient.instance.dio.httpClientAdapter = _StatusAdapter(200);
    final provider = ProjectProvider();

    await provider.loadCollaborators('1');

    expect(provider.errorMessage, isNull);
    expect(provider.collaboratorsFor('1'), isEmpty);
  });
}
