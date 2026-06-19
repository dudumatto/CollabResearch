class Message {
  const Message({
    required this.id,
    required this.content,
    required this.senderId,
    required this.sentAt,
    this.senderName,
    this.isEdited = false,
    this.isMine = false,
  });

  final String id;
  final String content;
  final String senderId;
  final String? senderName;
  final DateTime sentAt;
  final bool isEdited;
  final bool isMine;

  factory Message.fromJson(Map<String, dynamic> json) {
    final sentAtValue = json['sentAt'] ??
        json['dataEnvio'] ??
        json['createdAt'] ??
        json['timestamp'];
    return Message(
      id: '${json['id'] ?? ''}',
      content:
          '${json['content'] ?? json['conteudo'] ?? json['message'] ?? json['text'] ?? ''}',
      senderId:
          '${json['senderId'] ?? json['remetenteId'] ?? json['userId'] ?? json['sender']?['id'] ?? ''}',
      senderName: _nullableString(
        json['senderName'] ??
            json['remetenteNome'] ??
            json['userName'] ??
            json['sender']?['name'] ??
            json['sender']?['nome'],
      ),
      sentAt: DateTime.tryParse('$sentAtValue') ?? DateTime.now(),
      isEdited: json['isEdited'] == true || json['editada'] == true,
      isMine: json['isMine'] == true ||
          json['mine'] == true ||
          json['fromCurrentUser'] == true,
    );
  }

  static String? _nullableString(dynamic value) {
    if (value == null) return null;
    final text = '$value'.trim();
    return text.isEmpty ? null : text;
  }
}
