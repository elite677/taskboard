import { Router } from 'express';
import { z } from 'zod';
import { pool, query } from '../config/db.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { validate, parseId } from '../middleware/validate.js';
import { assertBoardMember } from '../middleware/access.js';

const router = Router();
const titleSchema = z.object({ title: z.string().trim().min(1).max(100) });

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT b.id, b.title, b.created_at, m.role
       FROM boards b JOIN board_members m ON m.board_id = b.id
      WHERE m.user_id = $1
      ORDER BY b.created_at DESC`,
    [req.user.id]
  );
  res.json({ boards: rows });
}));

router.post('/', validate(titleSchema), asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO boards (title, owner_id) VALUES ($1, $2) RETURNING id, title, created_at',
      [req.body.title, req.user.id]
    );
    const board = rows[0];
    await client.query(
      "INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'owner')",
      [board.id, req.user.id]
    );
    await client.query(
      `INSERT INTO lists (board_id, title, position)
       VALUES ($1, 'To do', 1000), ($1, 'In progress', 2000), ($1, 'Done', 3000)`,
      [board.id]
    );
    await client.query('COMMIT');
    res.status(201).json({ board: { ...board, role: 'owner' } });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

router.get('/:id', parseId, asyncHandler(async (req, res) => {
  const role = await assertBoardMember(req.user.id, req.id);
  const board = (await query('SELECT id, title FROM boards WHERE id = $1', [req.id])).rows[0];
  const lists = (await query(
    'SELECT id, title, position FROM lists WHERE board_id = $1 ORDER BY position', [req.id]
  )).rows;
  const cards = (await query(
    `SELECT c.id, c.list_id, c.title, c.description, c.due_date, c.position
       FROM cards c JOIN lists l ON l.id = c.list_id
      WHERE l.board_id = $1 ORDER BY c.position`, [req.id]
  )).rows;
  res.json({
    board: { ...board, role, lists: lists.map((l) => ({ ...l, cards: cards.filter((c) => c.list_id === l.id) })) },
  });
}));

router.patch('/:id', parseId, validate(titleSchema), asyncHandler(async (req, res) => {
  await assertBoardMember(req.user.id, req.id);
  const { rows } = await query(
    'UPDATE boards SET title = $1 WHERE id = $2 RETURNING id, title', [req.body.title, req.id]
  );
  res.json({ board: rows[0] });
}));

router.delete('/:id', parseId, asyncHandler(async (req, res) => {
  const role = await assertBoardMember(req.user.id, req.id);
  if (role !== 'owner') throw new HttpError(403, 'Only the board owner can delete it');
  await query('DELETE FROM boards WHERE id = $1', [req.id]);
  res.status(204).end();
}));

router.post('/:id/lists', parseId, validate(titleSchema), asyncHandler(async (req, res) => {
  await assertBoardMember(req.user.id, req.id);
  const { rows } = await query(
    `INSERT INTO lists (board_id, title, position)
     VALUES ($1, $2, COALESCE((SELECT MAX(position) FROM lists WHERE board_id = $1), 0) + 1000)
     RETURNING id, title, position`,
    [req.id, req.body.title]
  );
  res.status(201).json({ list: { ...rows[0], cards: [] } });
}));

export default router;
