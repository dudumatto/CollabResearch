# Agentes de Arquitetura do TCC

Esta pasta contem agentes e modelos de saida para transformar o codigo real do TCC em documentacao visual de arquitetura, com foco em gerar uma imagem clara para uso em banner academico.

## Objetivo

Os agentes devem ler o minimo necessario do projeto, identificar a arquitetura existente e produzir:

- resumo tecnico curto do sistema;
- mapa de frontend, backend, banco, seguranca e testes;
- diagrama Mermaid pronto para exportar;
- versao visual simplificada para banner;
- instrucoes para gerar SVG ou PNG.

## Projetos analisados

Use estes caminhos como referencia inicial:

| Parte | Caminho | Papel |
|---|---|---|
| Frontend | `../Front-end-tcc` | Aplicacao React/Vite com rotas, telas, providers, services e testes E2E |
| Backend | `../tcc-backend/tcc-backend` | API Spring Boot com controllers, services, repositories, DTOs, entidades, seguranca JWT e testes |
| Arquitetura | `.` | Agentes, templates, diagramas e imagens exportadas |

## Arquivos desta pasta

- `architecture-diagram-agent.md`: agente principal para ler frontend + backend e montar a imagem de arquitetura do sistema.
- `arquitetura-front-end.md`: roteiro especializado para mapear a arquitetura do frontend.
- `arquitetura-backend.md`: roteiro especializado para mapear API, seguranca, regras de negocio e persistencia.
- `arquitetura-sistema-banner.md`: template de entrega final para banner, com Mermaid e checklist visual.

## Fluxo recomendado

1. Rode o agente principal em `architecture-diagram-agent.md`.
2. Use `arquitetura-front-end.md` quando precisar detalhar melhor React, rotas e integracao com API.
3. Use `arquitetura-backend.md` quando precisar detalhar melhor API, seguranca, services, repositories e dados.
4. Preencha `arquitetura-sistema-banner.md` com os achados confirmados no codigo.
5. Exporte o Mermaid para SVG ou PNG.
6. Revise se a imagem esta legivel em formato de banner.

## Comandos uteis

Instalar Mermaid CLI, se necessario:

```bash
npm install -g @mermaid-js/mermaid-cli
```

Exportar para SVG:

```bash
mmdc -i arquitetura/arquitetura-sistema.mmd -o arquitetura/arquitetura-sistema.svg -b transparent
```

Exportar para PNG em alta resolucao:

```bash
mmdc -i arquitetura/arquitetura-sistema.mmd -o arquitetura/arquitetura-sistema.png -b transparent -s 3
```

## Regras de qualidade

- Nao inventar tecnologias, rotas, endpoints, entidades ou fluxos.
- Se algo nao for encontrado, registrar como `nao identificado no projeto`.
- Priorizar nomes reais dos arquivos, camadas e modulos.
- Para banner, reduzir texto: no maximo 3 a 5 palavras por bloco.
- Preferir fluxo horizontal: Usuario -> Frontend -> API -> Banco/Servicos externos.
- Preservar contraste e agrupamento visual entre frontend, backend, dados e validacao.
