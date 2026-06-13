import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __jobHunterPostgres: ReturnType<typeof postgres> | undefined;
  var __jobHunterDrizzle: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database operations will fail.");
}

function createClient() {
  return connectionString
    ? postgres(connectionString, { prepare: false, max: 10 })
    : null;
}

const client =
  globalThis.__jobHunterPostgres ?? createClient();

if (client && process.env.NODE_ENV !== "production") {
  globalThis.__jobHunterPostgres = client;
}

export const db = client
  ? (globalThis.__jobHunterDrizzle ?? drizzle(client, { schema }))
  : null;

if (db && process.env.NODE_ENV !== "production") {
  globalThis.__jobHunterDrizzle = db;
}

export function requireDb() {
  if (!db) {
    throw new Error("Database not configured. Set DATABASE_URL environment variable.");
  }
  return db;
}

export * from "./schema";
