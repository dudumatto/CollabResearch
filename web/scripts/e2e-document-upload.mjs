import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(repoRoot, "..");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    env[key.trim()] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function mergeEnv(...files) {
  return Object.assign({}, ...files.map(readEnvFile), process.env);
}

function required(env, key) {
  if (!env[key]) throw new Error(`Variavel obrigatoria ausente: ${key}`);
  return env[key];
}

function normalizeBaseUrl(value) {
  if (!value) return null;
  const trimmed = value.replace(/^['"]|['"]$/g, "").replace(/\/$/, "");
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

function jdbcToPgConfig(jdbcUrl, user, password, sslMode) {
  const parsed = jdbcUrl.match(/^jdbc:postgresql:\/\/([^/:?]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/);
  if (!parsed) throw new Error("DB_URL JDBC nao reconhecida.");

  const params = new URLSearchParams(parsed[4] ?? "");
  const sslRequired = sslMode === "require" || params.get("sslmode") === "require";
  return {
    host: parsed[1],
    port: Number(parsed[2] ?? 5432),
    database: parsed[3],
    user,
    password,
    ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw text.
  }
  return { response, body, text };
}

async function main() {
  const env = mergeEnv(
    path.join(repoRoot, ".env"),
    path.join(repoRoot, ".env.local"),
    path.join(workspaceRoot, "tcc-backend", "tcc-backend", ".env"),
  );

  const apiBaseUrl =
    normalizeBaseUrl(env.E2E_API_URL) ||
    normalizeBaseUrl(env.VITE_BACKEND_URL) ||
    normalizeBaseUrl(env.VITE_API_PROXY_TARGET) ||
    normalizeBaseUrl(env.VITE_API_URL);

  if (!apiBaseUrl) throw new Error("Nao foi possivel resolver a URL real da API.");

  const supabaseUrl = required(env, "VITE_SUPABASE_URL");
  const supabaseAnonKey = required(env, "VITE_SUPABASE_ANON_KEY");
  const dbConfig = jdbcToPgConfig(required(env, "DB_URL"), required(env, "DB_USER"), required(env, "DB_PASSWORD"), env.DB_SSL_MODE);

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const user = {
    nome: `E2E Documento ${runId}`,
    email: `e2e-documento-${runId}@teste.local`,
    senha: "SenhaE2E123!",
    ra: `RA${runId.slice(-8)}`,
  };

  console.log(`[config] api=${apiBaseUrl}`);
  console.log(`[config] supabase=${new URL(supabaseUrl).origin}`);
  console.log(`[config] dbHost=${dbConfig.host}`);

  const register = await fetchJson(`${apiBaseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(user),
  });

  console.log(`[auth] register status=${register.response.status}`);
  if (!register.response.ok) {
    console.log("[auth] body=", register.body);
    process.exitCode = 1;
    return;
  }

  const token = register.body?.token;
  const usuarioId = register.body?.usuario?.id ?? register.body?.user?.id;
  if (!token || !usuarioId) throw new Error("Resposta de cadastro sem token ou usuario.id.");

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const fileName = `e2e-documento-${runId}.pdf`;
  const storagePath = `usuarios/${usuarioId}/e2e/${fileName}`;
  const pdfBytes = new Blob([
    `%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\nE2E ${runId}`,
  ], { type: "application/pdf" });

  const upload = await supabase.storage
    .from("documents")
    .upload(storagePath, pdfBytes, {
      cacheControl: "60",
      contentType: "application/pdf",
      upsert: false,
    });

  console.log(`[supabase] upload error=${upload.error ? upload.error.message : "none"}`);
  if (upload.error) {
    process.exitCode = 1;
    return;
  }

  const publicUrl = supabase.storage.from("documents").getPublicUrl(storagePath).data.publicUrl;
  console.log(`[supabase] publicUrl=${publicUrl}`);

  const publicProbe = await fetch(publicUrl, { method: "GET" });
  console.log(`[public] get status=${publicProbe.status} contentType=${publicProbe.headers.get("content-type")}`);

  const metadataPayload = {
    usuarioId,
    tipo: "CURRICULO",
    nomeArquivo: fileName,
    url: publicUrl,
  };

  const metadata = await fetchJson(`${apiBaseUrl}/api/documentos/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(metadataPayload),
  });

  console.log(`[backend] upload metadata status=${metadata.response.status}`);
  if (!metadata.response.ok) {
    console.log("[backend] body=", metadata.body);
    process.exitCode = 1;
    return;
  }

  const documentoId = metadata.body?.id;
  console.log(`[backend] documentoId=${documentoId} status=${metadata.body?.status} urlMatches=${metadata.body?.url === publicUrl}`);

  const list = await fetchJson(`${apiBaseUrl}/api/documentos/usuario/${usuarioId}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  console.log(`[backend] list status=${list.response.status} count=${Array.isArray(list.body) ? list.body.length : "n/a"}`);
  const listed = Array.isArray(list.body) ? list.body.find((doc) => doc.id === documentoId) : null;
  console.log(`[backend] listed=${Boolean(listed)} listedUrlMatches=${listed?.url === publicUrl}`);

  for (const kind of ["preview", "download"]) {
    const redirect = await fetch(`${apiBaseUrl}/api/documentos/${documentoId}/${kind}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      redirect: "manual",
    });
    console.log(`[backend] ${kind} status=${redirect.status} locationMatches=${redirect.headers.get("location") === publicUrl}`);
  }

  const pool = new pg.Pool(dbConfig);
  try {
    const result = await pool.query(
      "select id_documento, id_usuario, tipo, nome_arquivo, caminho, status, data_envio from documento where id_documento = $1",
      [documentoId],
    );
    const row = result.rows[0];
    console.log(`[db] found=${Boolean(row)} caminhoMatches=${row?.caminho === publicUrl}`);
    if (row) {
      console.log(`[db] id=${row.id_documento} usuario=${row.id_usuario} tipo=${row.tipo} status=${row.status} nome=${row.nome_arquivo}`);
      console.log(`[db] caminho=${row.caminho}`);
    }
  } finally {
    await pool.end();
  }

  console.log("[result] E2E document upload completed");
}

main().catch((error) => {
  console.error("[fatal]", error.message);
  process.exitCode = 1;
});
