import 'package:flutter/material.dart';

import '../../core/utils/date_utils.dart';
import '../../models/app_notification.dart';

class NotificationTile extends StatelessWidget {
  const NotificationTile({
    super.key,
    required this.notification,
    this.onTap,
  });

  final AppNotification notification;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Icon(
        notification.isRead
            ? Icons.notifications_none
            : Icons.notifications_active,
      ),
      title: Text(notification.title),
      subtitle: Text(notification.description),
      trailing: Text(DateUtilsX.relative(notification.createdAt)),
    );
  }
}
