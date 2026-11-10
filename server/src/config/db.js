import pg from 'pg';
import 'dotenv/config';

// Return DATE columns as plain 'YYYY-MM-DD' strings (avoids timezone shifts)
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const query = (text, params) => pool.query(text, params);
