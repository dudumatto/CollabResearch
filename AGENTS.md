# CollabResearch project instructions

Read and follow `.codex/AGENTS.md` for the repository's engineering agents, skills, safety rules, UI rules, and verification checklist.

<!-- caveman-begin -->
## Caveman default: lite

Caveman `lite` is active by default for Codex conversations in this repository.

- Remove filler, pleasantries, hedging, repeated conclusions, unnecessary narration, and decorative formatting.
- Keep complete sentences, normal grammar, all technical details, exact code, commands, identifiers, paths, numbers, units, and error messages.
- Use normal clear prose for security warnings, irreversible actions, complex ordered procedures, documentation, code comments, commits, and any case where compression could create ambiguity.
- Match the user's language. Compression changes verbosity, not language or technical quality.
- `stop caveman`, `normal mode`, `$caveman off`, or `/caveman off` disables it for the current conversation.
- `$caveman lite`, `/caveman lite`, or `caveman mode` enables the project default again. Use `$caveman full` or `$caveman ultra` for stronger temporary compression.

Installed project-local Caveman skills live under `.agents/skills/`. Never require or write a global Caveman configuration for this repository.
<!-- caveman-end -->
