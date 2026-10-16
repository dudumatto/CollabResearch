// Migra banco (schema public) e Storage do Supabase antigo (sa-east-1) para um projeto novo.
// Uso (na raiz do repo, Docker Desktop aberto):
//   node scripts/migracao-regiao/migrar.mjs banco      -> pg_dump do antigo + pg_restore no novo + corrige URLs
//   node scripts/migracao-regiao/migrar.mjs storage    -> copia buckets e arquivos
//   node scripts/migracao-regiao/migrar.mjs verificar  -> compara contagens de linhas e arquivos
// Credenciais: antigo em backend/tcc-backend/.env; novo em scripts/migracao-regiao/.env.migracao.local (gitignored).
// O projeto antigo so e lido, nunca alterado.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../..");

function lerEnv(arquivo) {
  if (!fs.existsSync(arquivo)) throw new Error(`Arquivo nao encontrado: ${arquivo}`);
  return Object.fromEntries(
    fs.readFileSync(arquivo, "utf8").split(/\r?\n/)
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
  );
}

const antigoEnv = lerEnv(path.join(root, "backend/tcc-backend/.env"));
const novoEnv = lerEnv(path.join(dir, ".env.migracao.local"));

function projeto(url, key, senha, regiao) {
  const ref = new URL(url).hostname.split(".")[0];
  return { url: url.replace(/\/$/, ""), key, senha, ref, regiao };
}

const antigo = projeto(antigoEnv.SUPABASE_URL, antigoEnv.SUPABASE_SERVICE_ROLE_KEY, antigoEnv.DB_PASSWORD, "sa-east-1");
const novo = projeto(novoEnv.NEW_SUPABASE_URL, novoEnv.NEW_SUPABASE_SERVICE_ROLE_KEY, novoEnv.NEW_DB_PASSWORD, novoEnv.NEW_REGION || "us-east-1");
if (antigo.ref === novo.ref) throw new Error("Projeto novo igual ao antigo; confira NEW_SUPABASE_URL.");

// Session pooler (IPv4). O host varia entre aws-0 e aws-1; descobre qual aceita o projeto.
const poolerCache = {};
function poolerHost(p) {
  if (poolerCache[p.ref]) return poolerCache[p.ref];
  for (const prefixo of ["aws-0", "aws-1"]) {
    const host = `${prefixo}-${p.regiao}.pooler.supabase.com`;
    try {
      psql(p, "select 1", host);
      return (poolerCache[p.ref] = host);
    } catch { /* tenta o proximo */ }
  }
  throw new Error(`Nao consegui conectar no banco ${p.ref} (${p.regiao}). Confira senha e regiao.`);
}

function docker(args, p, input) {
  // Senha vai por variavel de ambiente (-e PGPASSWORD sem valor), nunca na linha de comando.
  return execFileSync("docker", ["run", "--rm", "-i", "-e", "PGPASSWORD", "-e", "PGSSLMODE=require",
    "-v", `${path.join(dir, "dump")}:/dump`, "postgres:17-alpine", ...args], {
    env: { ...process.env, PGPASSWORD: p.senha }, input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
  });
}

function conexao(p, host = poolerHost(p)) {
  return ["-h", host, "-p", "5432", "-U", `postgres.${p.ref}`, "-d", "postgres"];
}

function psql(p, sql, host) {
  return docker(["psql", ...conexao(p, host), "-At", "-v", "ON_ERROR_STOP=1", "-c", sql], p);
}

function contagens(p) {
  const tabelas = psql(p, "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1")
    .trim().split("\n").filter(Boolean);
  const sql = tabelas.map((t) => `select '${t}', count(*) from public."${t}"`).join(" union all ");
  return Object.fromEntries(psql(p, sql).trim().split("\n").filter(Boolean).map((l) => l.split("|")).map(([t, n]) => [t, Number(n)]));
}

function banco() {
  fs.mkdirSync(path.join(dir, "dump"), { recursive: true });
  const jaTem = psql(novo, "select count(*) from information_schema.tables where table_schema='public'").trim();
  if (jaTem !== "0") throw new Error(`O banco novo ja tem ${jaTem} tabelas em public. Use um projeto vazio.`);

  console.log("1/3 pg_dump do antigo...");
  docker(["pg_dump", ...conexao(antigo), "--schema=public", "--no-owner", "--no-privileges", "--format=custom", "--file=/dump/collab.dump"], antigo);

  console.log("2/3 pg_restore no novo...");
  // O schema public ja existe no projeto novo: tira CREATE/COMMENT SCHEMA da lista e restaura o resto
  // numa transacao unica (qualquer erro desfaz tudo).
  const lista = docker(["pg_restore", "--list", "/dump/collab.dump"], antigo)
    .split("\n").filter((l) => !/SCHEMA - public|COMMENT - SCHEMA public/.test(l)).join("\n");
  fs.writeFileSync(path.join(dir, "dump", "lista.txt"), lista);
  docker(["pg_restore", ...conexao(novo), "--no-owner", "--no-privileges", "--single-transaction", "--exit-on-error",
    "--use-list=/dump/lista.txt", "/dump/collab.dump"], novo);

  console.log("3/3 trocando URLs do projeto antigo pelas do novo...");
  const colunas = psql(novo, "select table_name||'.'||column_name from information_schema.columns where table_schema='public' and data_type in ('text','character varying')")
    .trim().split("\n").filter(Boolean);
  for (const coluna of colunas) {
    const [t, c] = coluna.split(".");
    const n = psql(novo, `with u as (update public."${t}" set "${c}" = replace("${c}", '${antigo.ref}.supabase.co', '${novo.ref}.supabase.co') where "${c}" like '%${antigo.ref}.supabase.co%' returning 1) select count(*) from u`).trim();
    if (n !== "0") console.log(`   ${coluna}: ${n} linha(s)`);
  }
  console.log("Banco copiado.");
}

async function storageApi(p, metodo, rota, corpo, headers = {}) {
  const res = await fetch(`${p.url}/storage/v1${rota}`, {
    method: metodo,
    headers: { apikey: p.key, Authorization: `Bearer ${p.key}`, ...(corpo && !(corpo instanceof Uint8Array) ? { "Content-Type": "application/json" } : {}), ...headers },
    body: corpo instanceof Uint8Array ? corpo : corpo ? JSON.stringify(corpo) : undefined,
  });
  return res;
}

async function listarArquivos(p, bucket, prefixo = "") {
  const arquivos = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await storageApi(p, "POST", `/object/list/${bucket}`, { prefix: prefixo, limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
    if (!res.ok) throw new Error(`Listagem ${bucket}/${prefixo} falhou: ${res.status} ${await res.text()}`);
    const itens = await res.json();
    for (const item of itens) {
      const caminho = prefixo ? `${prefixo}/${item.name}` : item.name;
      if (item.id === null) arquivos.push(...await listarArquivos(p, bucket, caminho));
      else arquivos.push({ caminho, tipo: item.metadata?.mimetype });
    }
    if (itens.length < 1000) return arquivos;
  }
}

const codificar = (caminho) => caminho.split("/").map(encodeURIComponent).join("/");

async function buckets(p) {
  const res = await storageApi(p, "GET", "/bucket");
  if (!res.ok) throw new Error(`Listar buckets falhou: ${res.status} ${await res.text()}`);
  return res.json();
}

async function storage() {
  for (const b of await buckets(antigo)) {
    const criar = await storageApi(novo, "POST", "/bucket", {
      id: b.id, name: b.name, public: b.public, file_size_limit: b.file_size_limit, allowed_mime_types: b.allowed_mime_types,
    });
    if (!criar.ok && !(await criar.text()).includes("already exists")) throw new Error(`Criar bucket ${b.id} falhou: ${criar.status}`);

    const arquivos = await listarArquivos(antigo, b.id);
    console.log(`Bucket ${b.id}: ${arquivos.length} arquivo(s)`);
    for (const [i, a] of arquivos.entries()) {
      const baixar = await storageApi(antigo, "GET", `/object/${b.id}/${codificar(a.caminho)}`);
      if (!baixar.ok) throw new Error(`Download ${a.caminho} falhou: ${baixar.status}`);
      const bytes = new Uint8Array(await baixar.arrayBuffer());
      const enviar = await storageApi(novo, "POST", `/object/${b.id}/${codificar(a.caminho)}`, bytes, {
        "Content-Type": a.tipo || baixar.headers.get("content-type") || "application/octet-stream", "x-upsert": "true",
      });
      if (!enviar.ok) throw new Error(`Upload ${a.caminho} falhou: ${enviar.status} ${await enviar.text()}`);
      console.log(`   ${i + 1}/${arquivos.length} ${a.caminho}`);
    }
  }
  console.log("Storage copiado.");
}

async function verificar() {
  const [a, n] = [contagens(antigo), contagens(novo)];
  let ok = true;
  for (const t of Object.keys(a)) {
    const igual = a[t] === n[t];
    ok &&= igual;
    if (!igual) console.log(`DIFERENTE ${t}: antigo=${a[t]} novo=${n[t] ?? "ausente"}`);
  }
  console.log(`Banco: ${Object.keys(a).length} tabelas ${ok ? "iguais" : "COM DIFERENCAS"}.`);
  for (const b of await buckets(antigo)) {
    const [qa, qn] = [(await listarArquivos(antigo, b.id)).length, (await listarArquivos(novo, b.id)).length];
    ok &&= qa === qn;
    console.log(`Storage ${b.id}: antigo=${qa} novo=${qn} ${qa === qn ? "ok" : "DIFERENTE"}`);
  }
  console.log(ok ? "\nTudo igual. Valores para o novo servico no Render:" : "\nHa diferencas; nao troque o backend ainda.");
  if (ok) {
    console.log(`  DB_URL=jdbc:postgresql://${poolerHost(novo)}:5432/postgres`);
    console.log(`  DB_USER=postgres.${novo.ref}`);
    console.log("  DB_PASSWORD=<senha do banco novo>");
    console.log(`  SUPABASE_URL=${novo.url}`);
    console.log("  SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY=<chaves do projeto novo>");
    console.log("  Demais variaveis (JWT_SECRET, CRON_SECRET, GOOGLE_CLIENT_ID...): iguais ao servico atual.");
  }
  process.exitCode = ok ? 0 : 1;
}

const etapas = { banco, storage, verificar };
const etapa = etapas[process.argv[2]];
if (!etapa) {
  console.log("Uso: node scripts/migracao-regiao/migrar.mjs banco|storage|verificar");
  process.exit(1);
}
await etapa();
