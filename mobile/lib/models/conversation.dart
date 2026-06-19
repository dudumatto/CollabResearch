class Conversation {
  const Conversation({
    required this.id,
    required this.title,
    required this.lastMessage,
    required this.lastUpdated,
    this.type,
    this.projectTitle,
    this.otherUserName,
    this.unreadCount = 0,
  });

  final String id;
  final String title;
  final String lastMessage;
  final DateTime lastUpdated;
  final String? type;
  final String? projectTitle;
  final String? otherUserName;
  final int unreadCount;

  factory Conversation.fromJson(Map<String, dynamic> json) {
    final lastUpdatedValue = json['lastUpdated'] ??
        json['updatedAt'] ??
        json['createdAt'] ??
        json['ultimaMensagemHorario'] ??
        json['dataCriacao'];
    final type = _nullableString(json['type'] ?? json['tipo']);
    final projectTitle = _nullableString(
      json['projectTitle'] ?? json['projetoTitulo'] ?? json['groupName'],
    );
    final otherUserName = _nullableString(
      json['otherUserName'] ??
          json['outroUsuarioNome'] ??
          json['participantName'] ??
          json['participant']?['name'] ??
          json['participant']?['nome'],
    );
    final rawTitle = _nullableString(
      json['title'] ?? json['titulo'] ?? json['name'],
    );
    return Conversation(
      id: '${json['id'] ?? json['conversationId'] ?? ''}',
      title: _displayTitle(
        rawTitle: rawTitle,
        type: type,
        projectTitle: projectTitle,
        otherUserName: otherUserName,
      ),
      lastMessage:
          '${json['lastMessage'] ?? json['ultimaMensagem'] ?? json['lastMessageContent'] ?? json['preview'] ?? ''}',
      lastUpdated: DateTime.tryParse('$lastUpdatedValue') ?? DateTime.now(),
      type: type,
      projectTitle: projectTitle,
      otherUserName: otherUserName,
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
    );
  }

  static String _displayTitle({
    required String? rawTitle,
    required String? type,
    required String? projectTitle,
    required String? otherUserName,
  }) {
    final normalizedType = type?.toUpperCase();
    final genericTitle = rawTitle == null ||
        RegExp(r'^conversa\s*\d*$', caseSensitive: false).hasMatch(rawTitle);

    if (normalizedType == 'PRIVADA' && otherUserName != null) {
      return otherUserName;
    }
    if (normalizedType == 'GRUPO' && projectTitle != null) {
      return projectTitle;
    }
    if (genericTitle) {
      return otherUserName ?? projectTitle ?? 'Conversa';
    }
    return rawTitle;
  }

  static String? _nullableString(dynamic value) {
    if (value == null) return null;
    final text = '$value'.trim();
    return text.isEmpty ? null : text;
  }
}
