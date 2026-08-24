<div align="center">

# CollabResearch Mobile

**Aplicativo Flutter do sistema de gerenciamento de TCC.**

<p>
  <img alt="Flutter" src="https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white">
  <img alt="Dart" src="https://img.shields.io/badge/Dart-0175C2?style=for-the-badge&logo=dart&logoColor=white">
  <img alt="GoRouter" src="https://img.shields.io/badge/GoRouter-0B57D0?style=for-the-badge">
</p>

</div>

---

## Visao geral

Aplicativo mobile para consulta de dashboard, projetos, inscricoes, progresso, notificacoes, chat, perfil e configuracoes.

## Objetivo

Levar os principais fluxos do CollabResearch para celular, mantendo acesso rapido aos dados do usuario e as interacoes com o backend.

## Funcionalidades principais

- Login e cadastro para alunos e orientadores.
- Dashboard com indicadores reais do backend.
- Criacao, edicao, listagem e detalhe de projetos.
- Inscricoes com aprovacao, rejeicao e cancelamento conforme o papel do usuario.
- Progresso e feedback vinculados ao projeto.
- Chat entre usuarios, com mensagens atualizadas via STOMP.
- Notificacoes consultadas pela API, com leitura individual ou em lote.
- Perfil e configuracoes com tema claro ou escuro.

## Tecnologias utilizadas

- Flutter
- Dart
- Provider
- GoRouter
- Dio
- flutter_dotenv
- flutter_secure_storage
- stomp_dart_client
- cached_network_image
- fl_chart
- intl

## Estrutura do projeto

```text
tcc-mobile/
|-- lib/
|   |-- core/        # Configuracao, API, tema, auth e utilitarios
|   |-- models/      # Modelos de dominio
|   |-- providers/   # Estado global
|   |-- router/      # Rotas do app
|   |-- screens/     # Telas
|   |-- services/    # Requisicoes HTTP e STOMP
|   `-- widgets/     # Componentes reutilizaveis
|-- android/
|-- web/
|-- windows/
|-- test/
`-- pubspec.yaml
```

## Pre-requisitos

- Flutter SDK compativel com Dart `>=3.3.0 <4.0.0`
- Dart compatível com o Flutter instalado
- Android Studio, Xcode ou ambiente Flutter Web/Windows conforme a plataforma alvo
- Backend CollabResearch em execucao

## Configuracao de ambiente

Crie um arquivo `.env` na raiz do mobile com a URL da API:

```env
API_URL=http://localhost:8080
```

O arquivo e lido por `flutter_dotenv`.

## Instalacao

```bash
flutter pub get
```

## Como executar localmente

```bash
flutter run
```

## Como gerar build

Android:

```bash
flutter build apk
```

Web:

```bash
flutter build web
```

Windows:

```bash
flutter build windows
```

## Arquitetura resumida

```mermaid
flowchart LR
    A["App Flutter"] --> B["ApiClient / Dio"]
    A --> C["STOMP / WebSocket"]
    B --> D["Backend Spring Boot"]
    C --> D
    D --> E["Banco de dados"]
```

O mobile consome a API HTTP do backend para CRUD e autentica o usuario com JWT. O token fica no `flutter_secure_storage`. O STOMP e usado apenas nas mensagens de chat porque o backend atual nao publica notificacoes por WebSocket; alertas sao atualizados ao entrar no app, abrir a tela ou puxar para atualizar.

## Validacao local

Os comandos usados para validar o projeto sao:

```bash
flutter analyze
flutter test
flutter build web
```

Pendencias conhecidas e evolucoes planejadas estao em [MELHORIAS.md](MELHORIAS.md).

## Equipe do projeto

Nao informada nos arquivos do repositorio.

## Licenca

Nao ha arquivo de licenca no repositorio.
