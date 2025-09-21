import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE || 'demo',
  user: process.env.PGUSER || 'demo',
  password: process.env.PGPASSWORD || 'demo'
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}
