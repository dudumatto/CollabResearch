import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/core/api/api_client.dart';
import 'package:tcc_mobile/models/project.dart';
import 'package:tcc_mobile/providers/academic_workspace_provider.dart';

/// O backend responde 403 em /etapas, /entregas e /avaliacoes de projetos em
/// que o usuario apenas se inscreveu -- e meusProjetos=true devolve esses
/// projetos junto com os demais. Este adaptador reproduz essa mistura.
class _PartialPermissionAdapter implements HttpClientAdapter {
  _PartialPermissionAdapter({required this.allowedProjectId});

  final String allowedProjectId;
  final List<String> requested = <String>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requested.add(options.path);
    final permitido = options.path.contains('/projetos/$allowedProjectId/');

    if (!permitido) {
      return ResponseBody.fromString(
        jsonEncode({
          'code': 'FORBIDDEN',
          'message': 'Sem permissao para consultar a equipe deste projeto',
          'status': 403,
        }),
        403,
        headers: {
          Headers.contentTypeHeader: [Headers.jsonContentType],
        },
      );
    }

    return ResponseBody.fromString(
      jsonEncode([
        {
          'id': 10,
          'titulo': 'Revisao bibliografica',
          'ordem': 1,
          'status': 'PENDENTE',
        }
      ]),
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

Project _project(String id) => Project(
      id: id,
      title: 'Projeto $id',
      area: 'Computacao',
      course: 'CC',
      status: 'EM_ANDAMENTO',
    );

void main() {
  late HttpClientAdapter original;
  late _PartialPermissionAdapter adapter;

  // O interceptor do ApiClient le o token do flutter_secure_storage antes de
  // cada request; sem simular o canal de plataforma a chamada nunca resolve e
  // o teste estoura o tempo limite.
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('plugins.it_nomads.com/flutter_secure_storage'),
      (call) async => call.method == 'read' ? null : <String, String>{},
    );

    original = ApiClient.instance.dio.httpClientAdapter;
    adapter = _PartialPermissionAdapter(allowedProjectId: '1');
    ApiClient.instance.dio.httpClientAdapter = adapter;
  });

  tearDown(() {
    ApiClient.instance.dio.httpClientAdapter = original;
  });

  test('um projeto sem permissao nao derruba a agenda inteira', () async {
    final provider = AcademicWorkspaceProvider();

    await provider.loadAgenda([_project('1'), _project('2')]);

    // O projeto permitido tem que aparecer...
    expect(provider.stagesByProject['1'], isNotEmpty);
    // ...o proibido fica vazio em vez de quebrar tudo...
    expect(provider.stagesByProject['2'], isEmpty);
    // ...e a tela nao mostra o erro de permissao no lugar dos prazos.
    expect(provider.errorMessage, isNull);
    expect(adapter.requested.length, 2);
  });

  test('entregas toleram projeto sem permissao', () async {
    final provider = AcademicWorkspaceProvider();

    await provider.loadDeliveriesForProjects([_project('1'), _project('2')]);

    expect(provider.errorMessage, isNull);
    expect(provider.deliveriesByProject['2'], isEmpty);
  });

  test('avaliacoes toleram projeto sem permissao', () async {
    final provider = AcademicWorkspaceProvider();

    await provider.loadEvaluationsForProjects([_project('1'), _project('2')]);

    expect(provider.errorMessage, isNull);
    expect(provider.evaluationsByProject['2'], isEmpty);
  });

  test('abrir um projeto alheio mostra vazio, nao aviso de permissao',
      () async {
    // O detalhe do projeto leva para /evaluations?projectId=X e
    // /deliveries?projectId=X sem exigir vinculo, entao da para cair aqui com
    // um projeto que so se pode olhar. As tres listas respondem 403.
    final provider = AcademicWorkspaceProvider();

    await provider.loadProjectWorkspace('2');

    expect(provider.errorMessage, isNull);
    expect(provider.stagesByProject['2'], isEmpty);
    expect(provider.deliveriesByProject['2'], isEmpty);
    expect(provider.evaluationsByProject['2'], isEmpty);
  });

  test('o projeto do usuario carrega normalmente', () async {
    final provider = AcademicWorkspaceProvider();

    await provider.loadProjectWorkspace('1');

    expect(provider.errorMessage, isNull);
    expect(provider.stagesByProject['1'], isNotEmpty);
  });
}
