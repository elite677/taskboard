import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { validate, parseId } from '../middleware/validate.js';
import { assertBoardMember, boardIdOfCard, boardIdOfList } from '../middleware/access.js';

const router = Router();

// .strict() rejects unknown keys, so the dynamic UPDATE below only ever sees these column names
const updateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  list_id: z.number().int().positive(),
  position: z.number().finite(),
}).partial().strict();

router.patch('/:id', parseId, validate(updateSchema), asyncHandler(async (req, res) => {
  const boardId = await boardIdOfCard(req.id);
  await assertBoardMember(req.user.id, boardId);

  // Moving to another list: make sure that list belongs to the same board
  if (req.body.list_id !== undefined && (await boardIdOfList(req.body.list_id)) !== boardId) {
    throw new HttpError(400, 'Target list is on a different board');
  }

  const entries = Object.entries(req.body);
  if (entries.length === 0) throw new HttpError(400, 'Nothing to update');
  const sets = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const { rows } = await query(
    `UPDATE cards SET ${sets} WHERE id = $${entries.length + 1}
     RETURNING id, list_id, title, description, due_date, position`,
    [...entries.map(([, v]) => v), req.id]
  );
  res.json({ card: rows[0] });
}));

router.delete('/:id', parseId, asyncHandler(async (req, res) => {
  await assertBoardMember(req.user.id, await boardIdOfCard(req.id));
  await query('DELETE FROM cards WHERE id = $1', [req.id]);
  res.status(204).end();
}));

export default router;
