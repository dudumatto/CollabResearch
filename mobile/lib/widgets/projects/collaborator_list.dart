import 'package:flutter/material.dart';

class CollaboratorList extends StatelessWidget {
  const CollaboratorList({super.key});

  @override
  Widget build(BuildContext context) {
    return const ListTile(
      leading: CircleAvatar(child: Icon(Icons.person)),
      title: Text('Colaborador'),
      subtitle: Text('Papel no projeto'),
    );
  }
}

