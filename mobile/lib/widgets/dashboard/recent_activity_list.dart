import 'package:flutter/material.dart';

import '../../models/app_notification.dart';
import '../../core/utils/date_utils.dart';
import '../common/app_card.dart';
import '../notifications/notification_presentation.dart';

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
            // titleFor, e nao notification.title: o backend nao manda titulo
            // nas notificacoes, entao o campo cru traz o nome do enum
            // ("INSCRICAO_RECEBIDA"). A tela de alertas ja passava por aqui;
            // esta lista nao, e por isso mostrava o valor bruto.
            ...notifications.take(3).map(
                  (notification) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    leading: Icon(
                      NotificationPresentation.of(notification.type).icon,
                    ),
                    title: Text(
                      NotificationPresentation.of(notification.type)
                          .titleFor(notification),
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
