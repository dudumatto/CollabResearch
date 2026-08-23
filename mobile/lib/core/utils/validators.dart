class Validators {
  static String? requiredField(String? value, {String label = 'Campo'}) {
    if (value == null || value.trim().isEmpty) {
      return '$label obrigatorio';
    }
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.isEmpty) return 'Email obrigatorio';
    final regex = RegExp(r'^[^@]+@[^@]+\.[^@]+');
    if (!regex.hasMatch(value)) return 'Email invalido';
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'Senha obrigatoria';
    if (value.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
    if (value.length > 72) return 'A senha deve ter no maximo 72 caracteres';
    return null;
  }

  static String? positiveInteger(String? value, {String label = 'Valor'}) {
    if (value == null || value.trim().isEmpty) return null;
    final number = int.tryParse(value.trim());
    if (number == null || number <= 0) return '$label deve ser maior que zero';
    return null;
  }
}
