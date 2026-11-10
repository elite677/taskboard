import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { asyncHandler } from '../middleware/errors.js';
import { validate, parseId } from '../middleware/validate.js';
import { assertBoardMember, boardIdOfList } from '../middleware/access.js';

const router = Router();

router.patch('/:id', parseId, validate(z.object({ title: z.string().trim().min(1).max(100) })),
  asyncHandler(async (req, res) => {
    await assertBoardMember(req.user.id, await boardIdOfList(req.id));
    const { rows } = await query(
      'UPDATE lists SET title = $1 WHERE id = $2 RETURNING id, title, position', [req.body.title, req.id]
    );
    res.json({ list: rows[0] });
  }));

router.delete('/:id', parseId, asyncHandler(async (req, res) => {
  await assertBoardMember(req.user.id, await boardIdOfList(req.id));
  await query('DELETE FROM lists WHERE id = $1', [req.id]);
  res.status(204).end();
}));

const newCardSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

router.post('/:id/cards', parseId, validate(newCardSchema), asyncHandler(async (req, res) => {
  await assertBoardMember(req.user.id, await boardIdOfList(req.id));
  const { title, description = '', due_date = null } = req.body;
  const { rows } = await query(
    `INSERT INTO cards (list_id, title, description, due_date, position)
     VALUES ($1, $2, $3, $4, COALESCE((SELECT MAX(position) FROM cards WHERE list_id = $1), 0) + 1000)
     RETURNING id, list_id, title, description, due_date, position`,
    [req.id, title, description, due_date]
  );
  res.status(201).json({ card: rows[0] });
}));

export default router;
