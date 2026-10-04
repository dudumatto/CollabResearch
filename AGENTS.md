# CollabResearch — instruções do projeto

Monorepo da plataforma de gerenciamento de TCC.

## Módulos

- `backend/` — API Java 21 / Spring Boot / PostgreSQL
- `web/` — frontend React 18 / Vite / Tailwind
- `desktop/` — painel administrativo Electron + React
- `mobile/` — aplicativo Flutter/Dart

## Fluxo de trabalho

1. Identifique qual módulo a tarefa afeta e siga os padrões daquele módulo.
2. Leia o código existente antes de editar; faça alterações localizadas, sem reescritas desnecessárias.
3. Implemente; não altere contratos entre clientes, API ou banco sem mapear o impacto.
4. Execute build/lint/testes relevantes do módulo, corrija os erros e repita até obter estado funcional.
5. Não exponha secrets ou tokens no frontend, mobile ou renderer Electron.
6. Não faça commit, push, reset destrutivo ou clean sem autorização explícita.

## Agents e skills

- Agents especializados por módulo: `.agents/agents/`.
- Skills técnicas: `.agents/skills/`. Carregue apenas as relevantes para a tarefa.
- Regras globais de segurança e UI: `.rules/`.
- Detalhes de roteamento e checklist: `.codex/AGENTS.md`.

<!-- caveman-begin -->
## Caveman default: ultra

Caveman `ultra` é o padrão neste repositório: compressão máxima de tokens; remova filler, bajulação e narração desnecessária; mantenha todos os detalhes técnicos exatos (código, comandos, caminhos, números, erros). Use prosa clara em avisos de segurança, ações irreversíveis e procedimentos complexos. Responda no idioma do usuário. `stop caveman` / `normal mode` desativa; `$caveman ultra` reativa.

Skill instalada em `.agents/skills/caveman/` e como plugin do Claude Code (`caveman@caveman`, escopo user).
<!-- caveman-end -->
