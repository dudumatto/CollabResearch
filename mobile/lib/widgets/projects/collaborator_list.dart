import 'package:flutter/material.dart';

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
      leading: CircleAvatar(
        foregroundImage: avatarUrl != null ? NetworkImage(avatarUrl!) : null,
        child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?'),
      ),
      title: Text(name),
      subtitle: Text(role),
    );
  }
}

