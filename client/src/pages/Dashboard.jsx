import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import AddForm from '../components/AddForm';

export default function Dashboard() {
  const [boards, setBoards] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/boards').then((d) => setBoards(d.boards)).catch((e) => setError(e.message));
  }, []);

  const addBoard = async (title) => {
    try {
      const { board } = await api.post('/api/boards', { title });
      setBoards((b) => [board, ...b]);
    } catch (e) { setError(e.message); }
  };

  const removeBoard = async (board) => {
    if (!window.confirm(`Delete "${board.title}" and all its cards?`)) return;
    try {
      await api.del(`/api/boards/${board.id}`);
      setBoards((b) => b.filter((x) => x.id !== board.id));
    } catch (e) { setError(e.message); }
  };

  return (
    <main className="page">
      <h1>Your boards</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {boards === null ? <p>Loading…</p> : (
        <div className="board-grid">
          {boards.map((b) => (
            <div key={b.id} className="board-tile">
              <Link to={`/boards/${b.id}`}>{b.title}</Link>
              {b.role === 'owner' && (
                <button className="btn ghost small" aria-label={`Delete ${b.title}`} onClick={() => removeBoard(b)}>Delete</button>
              )}
            </div>
          ))}
          <div className="board-tile new"><AddForm label="Create board" placeholder="Board name" onAdd={addBoard} /></div>
        </div>
      )}
      {boards?.length === 0 && <p className="hint">No boards yet. Create one to get started.</p>}
    </main>
  );
}
