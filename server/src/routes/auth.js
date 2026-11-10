import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { query } from '../config/db.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { validate } from '../middleware/validate.js';
import { COOKIE_NAME, cookieOptions, requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

const registerSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'must be at least 8 characters').max(100),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

router.post('/register', limiter, validate(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash]
    );
    res.cookie(COOKIE_NAME, signToken(rows[0].id), cookieOptions());
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') throw new HttpError(409, 'That email is already registered');
    throw err;
  }
}));

router.post('/login', limiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new HttpError(401, 'Incorrect email or password');
  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions());
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
}));

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.json({ ok: true });
});

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) throw new HttpError(401, 'Please log in');
  res.json({ user: rows[0] });
}));

export default router;
