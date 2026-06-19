import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/validators.dart';
import '../../providers/project_provider.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_text_field.dart';

class CreateProjectScreen extends StatefulWidget {
  const CreateProjectScreen({super.key});

  @override
  State<CreateProjectScreen> createState() => _CreateProjectScreenState();
}

class _CreateProjectScreenState extends State<CreateProjectScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _vacanciesController = TextEditingController();
  String _status = 'Ativo';
  String _area = 'Tecnologia';
  String _course = 'ADS';

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _vacanciesController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final project = await context.read<ProjectProvider>().createProject({
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'area': _area,
      'course': _course,
      'vacancies': int.tryParse(_vacanciesController.text.trim()) ?? 0,
      'status': _status,
    });
    if (!mounted || project == null) return;
    context.go('/projects/${project.id}');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Criar projeto')),
      body: Consumer<ProjectProvider>(
        builder: (context, provider, _) {
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
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _area,
              items: const [
                DropdownMenuItem(value: 'Tecnologia', child: Text('Tecnologia')),
                DropdownMenuItem(value: 'Educacao', child: Text('Educacao')),
                DropdownMenuItem(value: 'Saude', child: Text('Saude')),
              ],
              onChanged: (value) => setState(() => _area = value ?? _area),
              decoration: const InputDecoration(labelText: 'Area'),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _course,
              items: const [
                DropdownMenuItem(value: 'ADS', child: Text('ADS')),
                DropdownMenuItem(value: 'SI', child: Text('SI')),
                DropdownMenuItem(value: 'EC', child: Text('EC')),
              ],
              onChanged: (value) => setState(() => _course = value ?? _course),
              decoration: const InputDecoration(labelText: 'Curso'),
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Vagas',
              controller: _vacanciesController,
              keyboardType: TextInputType.number,
              validator: (value) => Validators.requiredField(value, label: 'Vagas'),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _status,
              items: const [
                DropdownMenuItem(value: 'Ativo', child: Text('Ativo')),
                DropdownMenuItem(value: 'Em andamento', child: Text('Em andamento')),
                DropdownMenuItem(value: 'Encerrado', child: Text('Encerrado')),
              ],
              onChanged: (value) => setState(() => _status = value ?? _status),
              decoration: const InputDecoration(labelText: 'Status'),
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'Salvar projeto',
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
