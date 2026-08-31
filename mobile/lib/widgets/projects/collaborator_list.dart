import 'package:flutter/material.dart';
import '../common/app_avatar.dart';

class CollaboratorList extends StatelessWidget {
  const CollaboratorList({
    super.key,
    required this.name,
    this.avatarUrl,
    this.role = 'Orientador do projeto',
  });

  final String name;
  final String? avatarUrl;
  final String role;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: AppAvatar(name: name, imageUrl: avatarUrl, radius: 20),
      title: Text(name),
      subtitle: Text(role),
    );
  }
}
