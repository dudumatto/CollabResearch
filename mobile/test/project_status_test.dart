import 'package:flutter_test/flutter_test.dart';
import 'package:tcc_mobile/core/theme/app_colors.dart';
import 'package:tcc_mobile/core/utils/project_status.dart';

void main() {
  test('formata status de projeto do backend para exibicao', () {
    expect(formatProjectStatus('EM_ANDAMENTO'), 'Em andamento');
    expect(formatProjectStatus('FINALIZADO'), 'Finalizado');
    expect(formatProjectStatus('ABERTO'), 'Aberto');
  });

  test('define cores e progresso estimado por status', () {
    expect(projectStatusColor('EM_ANDAMENTO'), AppColors.warning);
    expect(projectStatusColor('FINALIZADO'), AppColors.danger);
    expect(estimatedProjectProgress('EM_ANDAMENTO'), 50);
    expect(estimatedProjectProgress('FINALIZADO'), 100);
  });
}
