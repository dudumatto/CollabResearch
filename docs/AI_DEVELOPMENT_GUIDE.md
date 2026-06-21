# Guia de Desenvolvimento com IA - CollabResearch

Guia para adicionar, modificar e reutilizar agentes, skills e regras no monorepo.

## Estrutura do Monorepo

    tcc/
      .agents/          # Agents e skills de design (canonico)
        agents/         # Definicoes de agentes (formato MD)
        skills/         # Skills de design, image-gen, UI
      .skills/          # Skills de engenharia (canonico)
      .rules/           # Regras globais (canonico)
      .codex/           # Config Codex (AGENTS.md)
      .claude/          # Config Claude (CLAUDE.md)
      .mimocode/        # Config Mimo (plans/)
      backend/
      web/
      nextweb/
      desktop/
      mobile/

---

## Como Adicionar um Novo Agente

1. Crie um arquivo .md em .agents/agents/ com YAML frontmatter:

    ---
    name: meu_agente
    description: Descricao curta do agente.
    ---
    # Meu Agente
    ## Missao
    Descricao da missao do agente.

2. Adicione a referencia em .codex/AGENTS.md e .claude/CLAUDE.md.

3. Formatos suportados:
   - .agents/agents/: Markdown com YAML frontmatter (recomendado)
   - .codex/agents/: TOML (se necessario para Codex)
   - .claude/agents/: Markdown com YAML frontmatter

---

## Como Adicionar uma Nova Skill

### Skills de Design/Image-Gen

Coloque em .agents/skills/<nome-da-skill>/SKILL.md.

### Skills de Engenharia

Coloque em .skills/<nome-da-skill>/SKILL.md.

### Estrutura Minima de uma Skill

    .skills/minha-skill/
      SKILL.md

O SKILL.md deve comecar com:

    ---
    name: minha-skill
    description: Descricao curta da skill.
    ---
    # Minha Skill
    Conteudo da skill aqui...

---

## Como Adicionar uma Nova Regra

Crie um arquivo em .rules/:

    .rules/minha-regra.md

Adicione a referencia em .codex/AGENTS.md e .claude/CLAUDE.md.

---

## Reutilizacao Entre Ferramentas

| Recurso | Onde fica | Codex | Claude | Mimo |
|---------|-----------|-------|--------|------|
| Agents | .agents/agents/ | Referencia em AGENTS.md | Referencia em CLAUDE.md | Disponivel |
| Skills de design | .agents/skills/ | Referencia em AGENTS.md | Referencia em CLAUDE.md | Auto-detectado |
| Skills de eng. | .skills/ | Referencia em AGENTS.md | Referencia em CLAUDE.md | Referencia manual |
| Rules | .rules/ | Referencia em AGENTS.md | Referencia em CLAUDE.md | Referencia manual |

### Codex

Le .codex/AGENTS.md para encontrar agentes, skills e rules.
Referencia .agents/, .skills/ e .rules/ diretamente.

### Claude

Le .claude/CLAUDE.md para encontrar agentes, skills e rules.
Referencia .agents/, .skills/ e .rules/ diretamente.

### Mimo

Auto-detecta skills em .agents/skills/ via system prompt.
Para skills em .skills/, referencie manualmente no prompt.

---

## Estrutura Recomendada

- Mantenha agentes, skills e rules centralizados
- Nao duplicate arquivos entre .codex/, .claude/, .mimocode/
- Use nomes descritivos e consistentes
- Documente a finalidade de cada recurso
- Teste antes de commitar
