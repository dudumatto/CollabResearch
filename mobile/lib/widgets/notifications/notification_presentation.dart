import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../models/app_notification.dart';

/// REGRA DE COR DESTA TELA:
/// a **cor** comunica o desfecho (aprovado / recusado / atrasado / informativo)
/// e o **ícone** comunica o assunto (prazo, inscrição, projeto, mensagem,
/// progresso). Nenhuma cor aqui é decorativa — `.rules/anti-ai-ui.md` trata
/// "ícones multicoloridos sem regra" como anti-padrão.
enum NotificationSeverity { positive, negative, urgent, info, neutral }

/// Como um tipo de notificação do backend é apresentado. O casamento é por
/// valor exato do enum `TipoNotificacao`, não por `substring`: a versão
/// anterior fazia busca por trecho e colapsava seis tipos na mesma aparência,
/// deixando "projeto aceito" idêntico a "projeto recusado".
class NotificationPresentation {
  const NotificationPresentation({
    required this.label,
    required this.title,
    required this.icon,
    required this.severity,
  });

  /// Texto do selo.
  final String label;

  /// Título legível, usado quando o backend não manda um. O DTO
  /// `NotificacaoResponse` não tem campo de título, então sem isto a tela
  /// mostrava o nome cru do enum ("PRAZO_ATRASADO") para o usuário.
  final String title;

  final IconData icon;
  final NotificationSeverity severity;

  static NotificationPresentation of(String type) {
    return switch (type.trim().toUpperCase()) {
      'PRAZO_ATRASADO' => const NotificationPresentation(
          label: 'Prazo',
          title: 'Prazo atrasado',
          icon: Icons.event_busy_outlined,
          severity: NotificationSeverity.negative,
        ),
      'PRAZO_PROXIMO' => const NotificationPresentation(
          label: 'Prazo',
          title: 'Prazo se aproximando',
          icon: Icons.event_outlined,
          severity: NotificationSeverity.urgent,
        ),
      'PROJETO_REJEITADO' => const NotificationPresentation(
          label: 'Projeto',
          title: 'Projeto recusado',
          icon: Icons.folder_off_outlined,
          severity: NotificationSeverity.negative,
        ),
      'INSCRICAO_REJEITADA' => const NotificationPresentation(
          label: 'Inscrição',
          title: 'Inscrição recusada',
          icon: Icons.person_off_outlined,
          severity: NotificationSeverity.negative,
        ),
      'PROJETO_ACEITO' => const NotificationPresentation(
          label: 'Projeto',
          title: 'Projeto aceito',
          icon: Icons.folder_special_outlined,
          severity: NotificationSeverity.positive,
        ),
      'INSCRICAO_APROVADA' => const NotificationPresentation(
          label: 'Inscrição',
          title: 'Inscrição aprovada',
          icon: Icons.how_to_reg_outlined,
          severity: NotificationSeverity.positive,
        ),
      'PROGRESSO_REGISTRADO' => const NotificationPresentation(
          label: 'Progresso',
          title: 'Progresso registrado',
          icon: Icons.trending_up,
          severity: NotificationSeverity.positive,
        ),
      'INSCRICAO_RECEBIDA' => const NotificationPresentation(
          label: 'Inscrição',
          title: 'Nova inscrição recebida',
          icon: Icons.person_add_alt_outlined,
          severity: NotificationSeverity.neutral,
        ),
      'SOLICITACAO_ORIENTACAO' => const NotificationPresentation(
          label: 'Orientação',
          title: 'Pedido de orientação',
          icon: Icons.school_outlined,
          severity: NotificationSeverity.neutral,
        ),
      'MENSAGEM_RECEBIDA' => const NotificationPresentation(
          label: 'Mensagem',
          title: 'Nova mensagem',
          icon: Icons.forum_outlined,
          severity: NotificationSeverity.info,
        ),
      _ => const NotificationPresentation(
          label: 'Aviso',
          title: 'Notificação',
          icon: Icons.notifications_outlined,
          severity: NotificationSeverity.neutral,
        ),
    };
  }

  /// Título a exibir: o do servidor quando existe, senão o legível daqui.
  /// A comparação com o `type` cobre o fallback `?? type` do model, que fazia
  /// o nome do enum vazar para a tela.
  String titleFor(AppNotification notification) {
    final serverTitle = notification.title.trim();
    if (serverTitle.isEmpty || serverTitle == notification.type.trim()) {
      return title;
    }
    return serverTitle;
  }

  Color color(BuildContext context) {
    final isLight = Theme.of(context).brightness == Brightness.light;
    return switch (severity) {
      NotificationSeverity.positive =>
        isLight ? AppColors.success : AppColors.darkPrimary,
      NotificationSeverity.negative =>
        isLight ? AppColors.danger : AppColors.darkDanger,
      NotificationSeverity.urgent =>
        isLight ? AppColors.warning : AppColors.darkWarning,
      NotificationSeverity.info =>
        isLight ? AppColors.accent : AppColors.darkAccent,
      NotificationSeverity.neutral => Theme.of(context).colorScheme.primary,
    };
  }
}
