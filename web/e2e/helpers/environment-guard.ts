const BLOCKED_MESSAGE = `
═══════════════════════════════════════════════

  E2E EXECUTION BLOCKED

  Ambiente remoto detectado.

  Backend:
  {url}

  Os testes E2E criam e removem dados reais.
  Execute somente contra:

    • localhost
    • 127.0.0.1
    • 0.0.0.0
    • IPs de rede local (10.x, 172.16-31.x, 192.168.x)

  Execução cancelada.

═══════════════════════════════════════════════
`;

const PRIVATE_IP_REGEX =
  /^(https?:\/\/)?(10(\.\d{1,3}){3}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}|192\.168(\.\d{1,3}){2}|127(\.\d{1,3}){3}|0\.0\.0\.0)/i;

const ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];

function isLocalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (ALLOWED_HOSTS.includes(parsed.hostname)) return true;
    if (PRIVATE_IP_REGEX.test(url)) return true;
    return false;
  } catch {
    return false;
  }
}

function validateUrl(url: string, label: string): void {
  if (!url || !isLocalUrl(url)) {
    console.error(BLOCKED_MESSAGE.replace("{url}", url || "(empty)"));
    throw new Error(`E2E BLOCKED: ${label} aponta para ambiente remoto: ${url}`);
  }
}

export function assertLocalEnvironment(): void {
  const api =
    process.env.E2E_API_URL ?? process.env.VITE_API_URL ?? "http://127.0.0.1:8080";
  const base =
    process.env.E2E_BASE_URL ?? `http://127.0.0.1:${process.env.E2E_PORT ?? "5173"}`;

  validateUrl(api, "API_URL");
  validateUrl(base, "BASE_URL");
}

let _guardRan = false;

export function runGuardOnce(): void {
  if (_guardRan) return;
  _guardRan = true;
  assertLocalEnvironment();
}
