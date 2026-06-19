class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.description,
    required this.createdAt,
    this.isRead = false,
    this.type = 'info',
    this.actionUrl,
    this.relatedEntity,
    this.relatedEntityId,
    this.conversationId,
    this.messageId,
  });

  final String id;
  final String title;
  final String description;
  final DateTime createdAt;
  final bool isRead;
  final String type;
  final String? actionUrl;
  final String? relatedEntity;
  final String? relatedEntityId;
  final String? conversationId;
  final String? messageId;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final createdAtValue = json['createdAt'] ??
        json['dataCriacao'] ??
        json['date'] ??
        json['timestamp'];
    final type = '${json['type'] ?? json['tipo'] ?? 'info'}';
    final metadata = _mapValue(
      json['metadata'] ?? json['meta'] ?? json['dados'] ?? json['data'],
    );
    final actionUrl = _nullableString(
      json['actionUrl'] ?? json['link'] ?? json['rotaSugerida'],
    );
    final relatedEntity = _nullableString(
      json['relatedEntity'] ?? json['entidadeRelacionada'],
    );
    final relatedEntityId = _nullableString(
      json['relatedEntityId'] ?? json['entidadeId'],
    );
    final target = _chatTargetFrom(
      actionUrl: actionUrl,
      relatedEntity: relatedEntity,
      relatedEntityId: relatedEntityId,
      directConversationId: _nullableString(
        json['conversationId'] ??
            json['conversaId'] ??
            json['conversa_id'] ??
            metadata['conversationId'] ??
            metadata['conversaId'],
      ),
      directMessageId: _nullableString(
        json['messageId'] ??
            json['mensagemId'] ??
            json['mensagem_id'] ??
            metadata['messageId'] ??
            metadata['mensagemId'],
      ),
    );

    return AppNotification(
      id: '${json['id'] ?? ''}',
      title:
          '${json['title'] ?? json['subject'] ?? json['payloadResumo'] ?? type}',
      description:
          '${json['description'] ?? json['message'] ?? json['mensagem'] ?? json['content'] ?? ''}',
      createdAt: DateTime.tryParse('$createdAtValue') ?? DateTime.now(),
      isRead: json['isRead'] == true ||
          json['read'] == true ||
          json['lida'] == true,
      type: type,
      actionUrl: actionUrl,
      relatedEntity: relatedEntity,
      relatedEntityId: relatedEntityId,
      conversationId: target.conversationId,
      messageId: target.messageId,
    );
  }

  AppNotification copyWith({
    String? id,
    String? title,
    String? description,
    DateTime? createdAt,
    bool? isRead,
    String? type,
    String? actionUrl,
    String? relatedEntity,
    String? relatedEntityId,
    String? conversationId,
    String? messageId,
  }) {
    return AppNotification(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
      type: type ?? this.type,
      actionUrl: actionUrl ?? this.actionUrl,
      relatedEntity: relatedEntity ?? this.relatedEntity,
      relatedEntityId: relatedEntityId ?? this.relatedEntityId,
      conversationId: conversationId ?? this.conversationId,
      messageId: messageId ?? this.messageId,
    );
  }

  static Map<String, dynamic> _mapValue(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return value.map((key, value) => MapEntry('$key', value));
    return const <String, dynamic>{};
  }

  static String? _nullableString(dynamic value) {
    if (value == null) return null;
    final text = '$value'.trim();
    return text.isEmpty ? null : text;
  }

  static _ChatTarget _chatTargetFrom({
    required String? actionUrl,
    required String? relatedEntity,
    required String? relatedEntityId,
    required String? directConversationId,
    required String? directMessageId,
  }) {
    var conversationId = directConversationId;
    var messageId = directMessageId;

    final entity = relatedEntity?.toLowerCase();
    if (conversationId == null &&
        relatedEntityId != null &&
        (entity == 'conversa' || entity == 'conversation')) {
      conversationId = relatedEntityId;
    }

    final uri = _safeUri(actionUrl);
    if (uri != null) {
      conversationId ??= uri.queryParameters['conversationId'] ??
          uri.queryParameters['conversaId'] ??
          uri.queryParameters['conversa'];
      messageId ??= uri.queryParameters['messageId'] ??
          uri.queryParameters['mensagemId'] ??
          uri.queryParameters['mensagem'];

      if (conversationId == null) {
        final match =
            RegExp(r'(?:/app)?/conversas/([^/?#]+)').firstMatch(uri.path);
        conversationId = match?.group(1);
      }
    }

    return _ChatTarget(conversationId: conversationId, messageId: messageId);
  }

  static Uri? _safeUri(String? value) {
    if (value == null) return null;
    try {
      return Uri.parse(value);
    } catch (_) {
      return null;
    }
  }
}

class _ChatTarget {
  const _ChatTarget({required this.conversationId, required this.messageId});

  final String? conversationId;
  final String? messageId;
}
