import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import boardRoutes from './routes/boards.js';
import listRoutes from './routes/lists.js';
import cardRoutes from './routes/cards.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();

app.set('trust proxy', 1); // needed behind Render/Railway proxies for secure cookies + rate limiting
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/boards', requireAuth, boardRoutes);
app.use('/api/lists', requireAuth, listRoutes);
app.use('/api/cards', requireAuth, cardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
