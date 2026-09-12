import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Works in both Deno and Node.js
function getEnv(name: string): string | undefined {
  if (typeof Deno !== "undefined") {
    return Deno.env.get(name);
  }
  return process.env[name];
}

function getRequiredEnv(name: string): string {
  const value = getEnv(name);
  if (!value) throw new Error(`${name} is not defined`);
  return value;
}

const connectionString = getRequiredEnv("DATABASE_URL");

const client: NeonQueryFunction<any, any> = neon(connectionString);

export const db = {
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const result = await client(sql, params || []);
    return result as T[];
  },
  async execute(sql: string): Promise<void> {
    await client(sql);
  },
};
