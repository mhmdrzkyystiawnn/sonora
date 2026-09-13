import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _client: NeonQueryFunction<any, any> | null = null;

export function initDb(env: Record<string, string>) {
  const connectionString = env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }
  _client = neon(connectionString);
}

function getClient(): NeonQueryFunction<any, any> {
  if (!_client) {
    throw new Error("Database not initialized. Call initDb(env) first.");
  }
  return _client;
}

export const db = {
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const result = await getClient()(sql, params || []);
    return result as T[];
  },
  async execute(sql: string): Promise<void> {
    await getClient()(sql);
  },
};
