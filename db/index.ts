import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
export * as schema from "../db/schema";

const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite);
