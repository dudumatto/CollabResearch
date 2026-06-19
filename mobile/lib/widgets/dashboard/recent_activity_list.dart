import 'package:flutter/material.dart';

import '../../models/app_notification.dart';
import '../../core/utils/date_utils.dart';
import '../common/app_card.dart';

class RecentActivityList extends StatelessWidget {
  const RecentActivityList({super.key, required this.notifications});

  final List<AppNotification> notifications;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Atividades recentes',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          if (notifications.isEmpty)
            const Text('Nenhuma atividade recente.')
          else
            ...notifications.take(3).map(
                  (notification) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    leading: const Icon(Icons.event_note),
                    title: Text(
                      notification.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      DateUtilsX.relative(notification.createdAt),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}
