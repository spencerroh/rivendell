import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbUrl = process.env.DATABASE_URL ?? "file:./data/rivendell.db";
const dbPath = dbUrl.replace(/^file:/, "");
const absolutePath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath);

// data 디렉터리 자동 생성
const dir = path.dirname(absolutePath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(absolutePath);

// WAL 모드 활성화 (동시성 개선)
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
