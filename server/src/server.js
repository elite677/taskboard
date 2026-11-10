import app from './app.js';

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error('Missing JWT_SECRET or DATABASE_URL. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
