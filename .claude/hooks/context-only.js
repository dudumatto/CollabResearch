// PreToolUse (Edit|Write) dos agentes somente leitura: só permite escrever em .claude/context/.
const path = require("path");
let raw = "";
process.stdin.on("data", (d) => (raw += d)).on("end", () => {
  try {
    const file = path.resolve(JSON.parse(raw).tool_input.file_path).toLowerCase();
    const dir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd(), ".claude", "context").toLowerCase() + path.sep;
    if (file.startsWith(dir)) process.exit(0);
  } catch {}
  console.error("Agente somente leitura: só pode escrever em .claude/context/.");
  process.exit(2);
});
