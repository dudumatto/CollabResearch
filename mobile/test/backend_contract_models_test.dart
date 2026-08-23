import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/models/app_notification.dart';
import 'package:tcc_mobile/models/conversation.dart';
import 'package:tcc_mobile/models/dashboard_summary.dart';
import 'package:tcc_mobile/models/feedback_entry.dart';
import 'package:tcc_mobile/models/message.dart';
import 'package:tcc_mobile/models/progress_entry.dart';
import 'package:tcc_mobile/models/project.dart';
import 'package:tcc_mobile/models/subscription.dart';
import 'package:tcc_mobile/models/user.dart';

void main() {
  test('Project aceita payload do backend em portugues', () {
    final project = Project.fromJson({
      'id': 10,
      'titulo': 'Projeto TCC',
      'areaNome': 'Tecnologia',
      'cursoNome': 'ADS',
      'status': 'ABERTO',
      'vagas': 3,
      'vagasOcupadas': 2,
      'descricao': 'Descricao',
      'areaId': 5,
      'orientadorId': 7,
      'alunoCriadorId': 9,
    });

    expect(project.id, '10');
    expect(project.title, 'Projeto TCC');
    expect(project.area, 'Tecnologia');
    expect(project.course, 'ADS');
    expect(project.vacancies, 3);
    expect(project.collaborators, 2);
    expect(project.areaId, 5);
    expect(project.advisorId, '7');
    expect(project.ownerId, '9');
  });

  test('ProjectOption aceita catalogos do backend', () {
    final option = ProjectOption.fromJson({'id': 3, 'nome': 'Tecnologia'});

    expect(option.id, 3);
    expect(option.name, 'Tecnologia');
  });

  test('DashboardSummary aceita metricas reais do backend', () {
    final summary = DashboardSummary.fromJson({
      'meusProjetos': 2,
      'minhasInscricoes': 3,
      'inscricoesPendentes': 1,
      'notificacoesNaoLidas': 4,
      'conversasAtivas': 5,
    });

    expect(summary.myProjects, 2);
    expect(summary.mySubscriptions, 3);
    expect(summary.pendingSubscriptions, 1);
    expect(summary.unreadNotifications, 4);
    expect(summary.activeConversations, 5);
  });

  test('inscricao, progresso e feedback aceitam payloads do backend', () {
    final subscription = Subscription.fromJson({
      'id': 8,
      'status': 'PENDENTE',
      'projetoId': 4,
      'projetoTitulo': 'Projeto TCC',
      'alunoNome': 'Aluno Teste',
    });
    final progress = ProgressEntry.fromJson({
      'id': 9,
      'projetoId': 4,
      'tipo': 'MARCO',
      'descricao': 'Primeira entrega',
      'autorNome': 'Aluno Teste',
    });
    final feedback = FeedbackEntry.fromJson({
      'id': 10,
      'projetoId': 4,
      'nota': 5,
      'comentario': 'Excelente',
      'avaliadorNome': 'Aluno Teste',
    });

    expect(subscription.projectId, '4');
    expect(subscription.studentName, 'Aluno Teste');
    expect(progress.type, 'MARCO');
    expect(progress.description, 'Primeira entrega');
    expect(feedback.rating, 5);
    expect(feedback.reviewerName, 'Aluno Teste');
  });

  test('Conversation aceita payload do backend em portugues', () {
    final conversation = Conversation.fromJson({
      'id': 7,
      'titulo': 'Grupo do projeto',
      'ultimaMensagem': 'Ola',
      'ultimaMensagemHorario': '2026-06-14T20:10:00Z',
    });

    expect(conversation.id, '7');
    expect(conversation.title, 'Grupo do projeto');
    expect(conversation.lastMessage, 'Ola');
  });

  test('Conversation troca titulo generico por nome de pessoa ou grupo', () {
    final privateConversation = Conversation.fromJson({
      'id': 1,
      'titulo': 'Conversa 1',
      'tipo': 'PRIVADA',
      'outroUsuarioNome': 'Ana Souza',
    });
    final groupConversation = Conversation.fromJson({
      'id': 2,
      'titulo': 'Conversa 2',
      'tipo': 'GRUPO',
      'projetoTitulo': 'Sistema de TCC',
    });

    expect(privateConversation.title, 'Ana Souza');
    expect(groupConversation.title, 'Sistema de TCC');
  });

  test('Message aceita payload do backend em portugues', () {
    final message = Message.fromJson({
      'id': 5,
      'conteudo': 'Mensagem',
      'remetenteId': 2,
      'remetenteNome': 'Ana Souza',
      'editada': true,
      'dataEnvio': '2026-06-14T20:10:00Z',
    });

    expect(message.content, 'Mensagem');
    expect(message.senderId, '2');
    expect(message.senderName, 'Ana Souza');
    expect(message.isEdited, isTrue);
  });

  test('AppNotification aceita payload do backend em portugues', () {
    final notification = AppNotification.fromJson({
      'id': 3,
      'mensagem': 'Nova mensagem',
      'tipo': 'MENSAGEM_RECEBIDA',
      'lida': true,
      'dataCriacao': '2026-06-14T20:10:00',
      'entidadeRelacionada': 'Conversa',
      'entidadeId': 7,
      'rotaSugerida': '/conversas/7?mensagemId=9',
    });

    expect(notification.description, 'Nova mensagem');
    expect(notification.type, 'MENSAGEM_RECEBIDA');
    expect(notification.isRead, isTrue);
    expect(notification.conversationId, '7');
    expect(notification.messageId, '9');
    expect(notification.actionUrl, '/conversas/7?mensagemId=9');
  });

  test('User aceita perfil retornado pelo backend', () {
    final user = User.fromJson({
      'id': 1,
      'nome': 'Usuario Teste',
      'email': 'usuario@example.com',
      'tipo': 'ALUNO',
      'cursoNome': 'ADS',
    });

    expect(user.id, '1');
    expect(user.name, 'Usuario Teste');
    expect(user.course, 'ADS');
    expect(user.roles, contains('ALUNO'));
  });
}
