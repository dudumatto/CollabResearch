import 'package:dio/dio.dart';

import '../core/api/api_client.dart';
import '../core/api/api_endpoints.dart';
import '../models/conversation.dart';
import '../models/message.dart';
import '../models/user.dart';
import 'response_parser.dart';

class ChatService {
  ChatService() : _dio = ApiClient.instance.dio;

  final Dio _dio;

  Future<List<Conversation>> conversations() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.chatConversations);
    return parseListPayload(response.data).map(Conversation.fromJson).toList();
  }

  Future<List<User>> contacts() async {
    try {
      final response = await _dio.get<dynamic>(ApiEndpoints.users);
      return parseListPayload(response.data).map(User.fromJson).toList();
    } on DioException catch (error) {
      if (error.response?.statusCode != 403) rethrow;
      return const <User>[];
    }
  }

  Future<List<User>> projectContacts(String currentUserId) async {
    final projectsResponse =
        await _dio.get<dynamic>(ApiEndpoints.userProjects(currentUserId));
    final projects = parseListPayload(projectsResponse.data);
    final projectIds = projects
        .map((project) => '${project['id'] ?? ''}')
        .where((id) => id.isNotEmpty)
        .toSet();

    final responses = await Future.wait(
      projectIds.map(
        (id) => _dio.get<dynamic>(ApiEndpoints.projectCollaborators(id)),
      ),
    );
    final contactsById = <String, User>{};
    for (final response in responses) {
      for (final data in parseListPayload(response.data)) {
        final user = User.fromJson(data);
        if (user.id.isNotEmpty && user.id != currentUserId) {
          contactsById[user.id] = user;
        }
      }
    }
    return contactsById.values.toList();
  }

  Future<Conversation> openPrivateConversation(String userId) async {
    final response = await _dio.post<dynamic>(
      ApiEndpoints.privateConversation(userId),
    );
    return Conversation.fromJson(parseObjectPayload(response.data));
  }

  Future<List<Message>> messages(String conversationId) async {
    final response = await _dio.get<dynamic>(
      ApiEndpoints.conversationMessages(conversationId),
    );
    return parseListPayload(response.data).map(Message.fromJson).toList();
  }

  Future<Message> sendMessage(String conversationId, String content) async {
    final response = await _dio.post<dynamic>(
      ApiEndpoints.sendConversationMessage(conversationId),
      data: {'conteudo': content},
    );
    return Message.fromJson(parseObjectPayload(response.data));
  }

  Future<Message> editMessage(String messageId, String content) async {
    final response = await _dio.put<dynamic>(
      ApiEndpoints.conversationMessage(messageId),
      data: {'conteudo': content},
    );
    return Message.fromJson(parseObjectPayload(response.data));
  }

  Future<void> deleteMessage(String messageId) async {
    await _dio.delete<dynamic>(ApiEndpoints.conversationMessage(messageId));
  }
}
