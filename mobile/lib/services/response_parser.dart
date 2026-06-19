List<Map<String, dynamic>> parseListPayload(dynamic payload) {
  final value = _unwrapList(payload);
  if (value is! List) return <Map<String, dynamic>>[];
  return value
      .whereType<Map>()
      .map((item) => item.map((key, value) => MapEntry('$key', value)))
      .toList();
}

Map<String, dynamic> parseObjectPayload(dynamic payload) {
  final value = _unwrapObject(payload);
  if (value is! Map) return <String, dynamic>{};
  return value.map((key, value) => MapEntry('$key', value));
}

dynamic _unwrapList(dynamic payload) {
  if (payload is List) return payload;
  if (payload is Map) {
    for (final key in const ['content', 'data', 'items', 'results', 'notifications', 'projects', 'messages', 'conversations']) {
      final value = payload[key];
      if (value is List) return value;
      if (value is Map || value is List) {
        final nested = _unwrapList(value);
        if (nested is List) return nested;
      }
    }
  }
  return payload;
}

dynamic _unwrapObject(dynamic payload) {
  if (payload is Map) {
    for (final key in const ['data', 'project', 'notification', 'message', 'conversation']) {
      final value = payload[key];
      if (value is Map) return value;
    }
  }
  return payload;
}
