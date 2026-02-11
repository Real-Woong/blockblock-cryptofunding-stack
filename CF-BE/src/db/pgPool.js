import "dotenv/config";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const ca = fs.readFileSync(path.resolve("certs/rds-global-bundle.pem"), "utf8");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca,
    rejectUnauthorized: true,
  },

  // 🔽 핵심
  max: 2,                 // 기본 10 → 2로 줄이기
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000, // 5초 → 10초
});