import { query } from '../config/db.js';
import { HttpError } from './errors.js';

// Throws 404 (not 403) so we never reveal that someone else's board exists
export async function assertBoardMember(userId, boardId) {
  const { rows } = await query(
    'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
    [boardId, userId]
  );
  if (!rows[0]) throw new HttpError(404, 'Board not found');
  return rows[0].role;
}

export async function boardIdOfList(listId) {
  const { rows } = await query('SELECT board_id FROM lists WHERE id = $1', [listId]);
  if (!rows[0]) throw new HttpError(404, 'List not found');
  return rows[0].board_id;
}

export async function boardIdOfCard(cardId) {
  const { rows } = await query(
    'SELECT l.board_id FROM cards c JOIN lists l ON l.id = c.list_id WHERE c.id = $1',
    [cardId]
  );
  if (!rows[0]) throw new HttpError(404, 'Card not found');
  return rows[0].board_id;
}
