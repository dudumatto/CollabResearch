import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/models/app_notification.dart';
import 'package:tcc_mobile/models/conversation.dart';
import 'package:tcc_mobile/models/message.dart';
import 'package:tcc_mobile/models/project.dart';
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
      'descricao': 'Descricao',
    });

    expect(project.id, '10');
    expect(project.title, 'Projeto TCC');
    expect(project.area, 'Tecnologia');
    expect(project.course, 'ADS');
    expect(project.vacancies, 3);
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
