import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/validators.dart';
import '../../providers/project_provider.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/loading_indicator.dart';
import '../../widgets/common/app_text_field.dart';

class EditProjectScreen extends StatefulWidget {
  const EditProjectScreen({super.key, required this.projectId});

  final String projectId;

  @override
  State<EditProjectScreen> createState() => _EditProjectScreenState();
}

class _EditProjectScreenState extends State<EditProjectScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _descriptionController = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final project = await context.read<ProjectProvider>().loadProject(widget.projectId);
      if (!mounted || project == null) return;
      _titleController.text = project.title;
      _descriptionController.text = project.description ?? '';
      setState(() => _initialized = true);
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final project = await context.read<ProjectProvider>().updateProject(widget.projectId, {
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
    });
    if (!mounted || project == null) return;
    context.go('/projects/${project.id}');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Editar projeto')),
      body: Consumer<ProjectProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && !_initialized) {
            return const LoadingIndicator(label: 'Carregando projeto...');
          }

          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                if (provider.errorMessage != null) ...[
                  Text(
                    provider.errorMessage!,
                    style: TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                  const SizedBox(height: 16),
                ],
            AppTextField(
              label: 'Titulo',
              controller: _titleController,
              validator: (value) => Validators.requiredField(value, label: 'Titulo'),
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Descricao',
              controller: _descriptionController,
              maxLines: 4,
              validator: (value) => Validators.requiredField(value, label: 'Descricao'),
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'Atualizar projeto',
              isLoading: provider.isLoading,
              onPressed: _save,
            ),
              ],
            ),
          );
        },
      ),
    );
  }
}
