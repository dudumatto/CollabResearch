import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/models/academic_workspace.dart';

void main() {
  test('etapa interpreta prazo, responsabilidade e conclusao', () {
    final stage = ProjectStage.fromJson({
      'id': 7,
      'projetoId': 4,
      'titulo': 'Revisao bibliografica',
      'status': 'DONE',
      'responsavel': 'ALUNO',
      'prazo': '2026-09-10T18:00:00Z',
      'peso': 20,
      'obrigatoria': true,
    });

    expect(stage.id, '7');
    expect(stage.projectId, '4');
    expect(stage.responsible, 'ALUNO');
    expect(stage.weight, 20);
    expect(stage.required, isTrue);
    expect(stage.isDone, isTrue);
  });

  group('prazo da etapa', () {
    ProjectStage stageWithDeadline(DateTime? deadline, {String status = 'ACTIVE'}) {
      return ProjectStage.fromJson({
        'id': 1,
        'projetoId': 4,
        'titulo': 'Etapa',
        'status': status,
        'prazo': deadline?.toIso8601String(),
      });
    }

    test('prazo de hoje mais cedo ainda nao esta atrasado', () {
      final now = DateTime.now();
      final earlierToday = DateTime(now.year, now.month, now.day);
      // O prazo e uma data, nao um instante: vencer "hoje" nao pode ficar
      // vermelho as 00h01.
      expect(stageWithDeadline(earlierToday).isOverdue, isFalse);
    });

    test('prazo de ontem esta atrasado', () {
      final yesterday = DateTime.now().subtract(const Duration(days: 1));
      expect(stageWithDeadline(yesterday).isOverdue, isTrue);
    });

    test('etapa concluida nunca conta como atrasada', () {
      final yesterday = DateTime.now().subtract(const Duration(days: 1));
      expect(
        stageWithDeadline(yesterday, status: 'DONE').isOverdue,
        isFalse,
      );
    });

    test('daysUntilDeadline conta em dias inteiros', () {
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      expect(stageWithDeadline(today).daysUntilDeadline, 0);
      expect(
        stageWithDeadline(today.add(const Duration(days: 3)))
            .daysUntilDeadline,
        3,
      );
      expect(
        stageWithDeadline(today.subtract(const Duration(days: 2)))
            .daysUntilDeadline,
        -2,
      );
    });

    test('sem prazo, daysUntilDeadline e nulo e nao ha atraso', () {
      final stage = stageWithDeadline(null);
      expect(stage.daysUntilDeadline, isNull);
      expect(stage.isOverdue, isFalse);
    });
  });

  test('avaliacao preserva notas, media e ciencia', () {
    final evaluation = AcademicEvaluation.fromJson({
      'id': 9,
      'projetoId': 4,
      'etapaId': 7,
      'etapaTitulo': 'Revisao bibliografica',
      'alunoId': 2,
      'alunoNome': 'Ana Souza',
      'orientadorNome': 'Carlos Lima',
      'participacao': 4,
      'qualidadeTecnica': 5,
      'cumprimentoDePrazos': 3,
      'comunicacao': 4,
      'media': 4.0,
      'cienciaRegistrada': true,
      'comentarioAluno': 'Ciente',
    });

    expect(evaluation.studentId, '2');
    expect(evaluation.technicalQuality, 5);
    expect(evaluation.average, 4);
    expect(evaluation.acknowledged, isTrue);
    expect(evaluation.studentComment, 'Ciente');
  });

  test('orientando interpreta vinculos, progresso e detalhe', () {
    final detail = AdviseeDetail.fromJson({
      'alunoId': 2,
      'alunoUsuarioId': 12,
      'nome': 'Ana Souza',
      'email': 'ana@example.com',
      'progresso': 62,
      'projetos': [
        {
          'projetoId': 4,
          'projetoTitulo': 'Pesquisa aplicada',
          'status': 'EM_ANDAMENTO',
        },
      ],
      'projetoSelecionado': {
        'projetoId': 4,
        'projetoTitulo': 'Pesquisa aplicada',
        'status': 'EM_ANDAMENTO',
      },
      'etapas': [
        {'id': 7, 'titulo': 'Revisao', 'status': 'ACTIVE'},
      ],
    });

    expect(detail.summary.userId, '12');
    expect(detail.summary.progress, 62);
    expect(detail.summary.projects.single.id, '4');
    expect(detail.selectedProject?.title, 'Pesquisa aplicada');
    expect(detail.stages.single.title, 'Revisao');
  });

  test('documento e dashboard do orientador aceitam contratos reais', () {
    final document = AcademicDocument.fromJson({
      'id': 6,
      'nomeArquivo': 'historico.pdf',
      'tipo': 'HISTORICO',
      'status': 'APROVADO',
      'url': 'https://example.com/historico.pdf',
      'dataEnvio': '2026-08-30T10:00:00',
    });
    final dashboard = AdvisorDashboard.fromJson({
      'metricas': {
        'projetosAtivos': 3,
        'orientandosAtivos': 5,
        'etapasAtrasadas': 2,
        'entregasAguardandoRevisao': 4,
        'avaliacoesAguardandoCiencia': 1,
      },
    });

    expect(document.name, 'historico.pdf');
    expect(document.status, 'APROVADO');
    expect(document.externalUri?.scheme, 'https');
    expect(dashboard.activeProjects, 3);
    expect(dashboard.activeAdvisees, 5);
    expect(dashboard.deliveriesToReview, 4);
  });

  test('reenvio de entrega fica restrito ao autor aluno', () {
    final delivery = DeliveryItem.fromJson({
      'id': 3,
      'projetoId': 4,
      'titulo': 'Monografia',
      'status': 'CHANGES_REQUESTED',
      'autorId': 12,
    });

    expect(delivery.canResubmit(userId: '12', isAdvisor: false), isTrue);
    expect(delivery.canResubmit(userId: '15', isAdvisor: false), isFalse);
    expect(delivery.canResubmit(userId: '12', isAdvisor: true), isFalse);
  });

  test('solicitar ajustes exige comentario e aprovar nao exige', () {
    expect(
      validateDeliveryReviewComment('CHANGES_REQUESTED', '   '),
      'Informe os ajustes necessários.',
    );
    expect(
      validateDeliveryReviewComment('CHANGES_REQUESTED', 'Corrigir capítulo 2'),
      isNull,
    );
    expect(validateDeliveryReviewComment('APPROVED', ''), isNull);
  });
}
