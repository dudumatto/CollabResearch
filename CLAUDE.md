# CollabResearch instructions for Claude Code

## Context first

- Treat `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json` as the primary architecture index for this repository.
- Before broad source exploration, query or inspect the graph with `graphify query`, `graphify explain`, or `graphify path`.
- Read source files only for the specific nodes, paths, and contracts needed for the task. Do not scan the whole repository when the graph can answer the question.
- Refresh the graph with `graphify . --code-only` after substantial structural changes.

## Defaults

- Keep Ponytail enabled in `lite` mode. Prefer existing code, standard-library or platform features, and the smallest complete implementation. Preserve validation, security, error handling, tests, and accessibility.
- Follow the repository's Caveman `lite` guidance in `AGENTS.md`: concise Portuguese responses, no filler, and no loss of technical details.
- Use RTK for shell commands when available (`rtk git status`, `rtk git diff`, `rtk test`, and related wrappers) so command output stays compact.

## Review gate

- Before any `git commit`, run Open Code Review on the pending changes with `ocr review` or the `/open-code-review:review` command. Fix or explicitly report findings before committing.
- Before any production build, publish, or deployment, run the relevant Open Code Review review and scan. Do not claim production readiness without a successful review result.
- Never include secrets, tokens, or credentials in source, generated graph files, frontend code, mobile code, or Electron renderer code.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
