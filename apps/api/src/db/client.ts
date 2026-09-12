/// <reference lib="deno.ns" />

import { drizzle } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema.ts";

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not defined}`);
  }

  return value;
}

const connectionString = getRequiredEnv("DATABASE_URL");

const client = neon(connectionString);

export const db = drizzle(client, { schema });
