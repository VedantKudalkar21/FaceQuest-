
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from server/.env");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export async function testDatabase() {
  const result = await pool.query(
    "SELECT current_database() AS database, NOW() AS server_time"
  );
  return result.rows[0];
}
export default pool;
