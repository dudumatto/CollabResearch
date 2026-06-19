import { Client } from "pg";

function getDbConfig() {
  const connectionString = process.env.E2E_DB_URL ?? process.env.DB_URL;
  if (!connectionString) return null;

  return {
    connectionString,
    user: process.env.E2E_DB_USER ?? process.env.DB_USER,
    password: process.env.E2E_DB_PASSWORD ?? process.env.DB_PASSWORD,
  };
}

export async function findUserByEmail(email: string): Promise<{ id: number; email: string } | null> {
  const config = getDbConfig();
  if (!config) return null;

  const client = new Client(config);
  await client.connect();
  try {
    const result = await client.query(
      "select id_usuario as id, email from usuario where lower(email) = lower($1) limit 1",
      [email],
    );
    return (result.rows[0] as { id: number; email: string } | undefined) ?? null;
  } finally {
    await client.end();
  }
}
