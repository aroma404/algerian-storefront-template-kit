import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;

export function getPool() {
  if (!pool && process.env.DATABASE_URL) pool = mysql.createPool({ uri: process.env.DATABASE_URL, waitForConnections: true, connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 8), queueLimit: 0, enableKeepAlive: true, keepAliveInitialDelay: 0 });
  return pool;
}
