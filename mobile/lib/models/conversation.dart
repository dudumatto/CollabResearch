/// Estado de entrega da ultima mensagem. Preenchido apenas quando a API
/// informa o dado; sem ele a lista nao exibe indicador algum.
enum MessageDeliveryStatus { sent, delivered, read }

class Conversation {
  const Conversation({
    required this.id,
    required this.title,
    required this.lastMessage,
    required this.lastUpdated,
    this.type,
    this.projectTitle,
    this.otherUserName,
    this.avatarUrl,
    this.unreadCount = 0,
    this.lastMessageFromMe,
    this.lastMessageStatus,
  });

  final String id;
  final String title;
  final String lastMessage;
  final DateTime lastUpdated;
  final String? type;
  final String? projectTitle;
  final String? otherUserName;
  final String? avatarUrl;
  final int unreadCount;

  /// `null` quando a API nao informa quem enviou a ultima mensagem.
  final bool? lastMessageFromMe;

  /// `null` quando a API nao informa o estado de entrega.
  final MessageDeliveryStatus? lastMessageStatus;

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
      avatarUrl: _nullableString(
        json['fotoPerfilUrl'] ??
            json['avatarUrl'] ??
            json['outroUsuario']?['fotoPerfilUrl'] ??
            json['outroUsuario']?['avatarUrl'] ??
            json['participant']?['fotoPerfilUrl'] ??
            json['participant']?['avatarUrl'] ??
            json['participante']?['fotoPerfilUrl'] ??
            json['participante']?['avatarUrl'],
      ),
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      lastMessageFromMe: _nullableBool(
        json['lastMessageFromMe'] ??
            json['ultimaMensagemMinha'] ??
            json['ultimaMensagemPropria'],
      ),
      lastMessageStatus: _parseDeliveryStatus(
        json['lastMessageStatus'] ??
            json['ultimaMensagemStatus'] ??
            json['statusUltimaMensagem'],
      ),
    );
  }

  static bool? _nullableBool(dynamic value) {
    if (value is bool) return value;
    if (value is String) {
      final text = value.trim().toLowerCase();
      if (text == 'true') return true;
      if (text == 'false') return false;
    }
    return null;
  }

  static MessageDeliveryStatus? _parseDeliveryStatus(dynamic value) {
    if (value == null) return null;
    switch ('$value'.trim().toUpperCase()) {
      case 'READ':
      case 'LIDA':
      case 'LIDO':
        return MessageDeliveryStatus.read;
      case 'DELIVERED':
      case 'ENTREGUE':
        return MessageDeliveryStatus.delivered;
      case 'SENT':
      case 'ENVIADA':
      case 'ENVIADO':
        return MessageDeliveryStatus.sent;
      default:
        return null;
    }
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
