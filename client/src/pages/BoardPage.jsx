import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { api } from '../api';
import AddForm from '../components/AddForm';
import CardModal from '../components/CardModal';

// New position = midpoint between neighbours, so one PATCH moves one card
function calcPosition(cards, index) {
  const prev = cards[index - 1]?.position;
  const next = cards[index]?.position;
  if (prev === undefined && next === undefined) return 1000;
  if (prev === undefined) return next / 2;
  if (next === undefined) return prev + 1000;
  return (prev + next) / 2;
}

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

export default function BoardPage() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    api.get(`/api/boards/${id}`).then((d) => setBoard(d.board)).catch((e) => setError(e.message));
  }, [id]);

  const mapLists = (fn) => setBoard((b) => ({ ...b, lists: fn(b.lists) }));
  const fail = (e) => setError(e.message);

  const addList = async (title) => {
    try {
      const { list } = await api.post(`/api/boards/${id}/lists`, { title });
      mapLists((ls) => [...ls, list]);
    } catch (e) { fail(e); }
  };

  const deleteList = async (list) => {
    if (!window.confirm(`Delete "${list.title}" and its ${list.cards.length} cards?`)) return;
    try {
      await api.del(`/api/lists/${list.id}`);
      mapLists((ls) => ls.filter((l) => l.id !== list.id));
    } catch (e) { fail(e); }
  };

  const addCard = async (listId, title) => {
    try {
      const { card } = await api.post(`/api/lists/${listId}/cards`, { title });
      mapLists((ls) => ls.map((l) => (l.id === listId ? { ...l, cards: [...l.cards, card] } : l)));
    } catch (e) { fail(e); }
  };

  const saveCard = async (cardId, changes) => {
    try {
      const { card } = await api.patch(`/api/cards/${cardId}`, changes);
      mapLists((ls) => ls.map((l) => ({ ...l, cards: l.cards.map((c) => (c.id === cardId ? card : c)) })));
    } catch (e) { fail(e); }
  };

  const deleteCard = async (cardId) => {
    try {
      await api.del(`/api/cards/${cardId}`);
      mapLists((ls) => ls.map((l) => ({ ...l, cards: l.cards.filter((c) => c.id !== cardId) })));
    } catch (e) { fail(e); }
  };

  const onDragEnd = ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcId = Number(source.droppableId);
    const dstId = Number(destination.droppableId);
    const cardId = Number(draggableId);
    const snapshot = board;

    const card = board.lists.find((l) => l.id === srcId).cards.find((c) => c.id === cardId);
    const dstWithout = board.lists.find((l) => l.id === dstId).cards.filter((c) => c.id !== cardId);
    const position = calcPosition(dstWithout, destination.index);
    const moved = { ...card, list_id: dstId, position };

    // Optimistic update: the UI moves instantly, we roll back if the server says no
    mapLists((ls) => ls.map((l) => {
      if (l.id === dstId) {
        const cards = [...dstWithout];
        cards.splice(destination.index, 0, moved);
        return { ...l, cards };
      }
      if (l.id === srcId) return { ...l, cards: l.cards.filter((c) => c.id !== cardId) };
      return l;
    }));

    api.patch(`/api/cards/${cardId}`, { list_id: dstId, position }).catch(() => {
      setBoard(snapshot);
      setError('Could not move that card. It has been put back.');
    });
  };

  if (error && !board) return <main className="page"><p className="error">{error}</p><Link to="/">Back to boards</Link></main>;
  if (!board) return <p className="center-note">Loading…</p>;

  return (
    <main className="board-page">
      <div className="board-head">
        <Link to="/" className="back">Boards</Link>
        <h1>{board.title}</h1>
      </div>
      {error && <p className="error banner" role="alert" onClick={() => setError('')}>{error} (click to dismiss)</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="lists">
          {board.lists.map((list) => (
            <section key={list.id} className="list">
              <header className="list-head">
                <h2>{list.title} <span className="count">{list.cards.length}</span></h2>
                <button className="btn ghost small" aria-label={`Delete list ${list.title}`} onClick={() => deleteList(list)}>Delete</button>
              </header>

              <Droppable droppableId={String(list.id)}>
                {(drop, snap) => (
                  <div ref={drop.innerRef} {...drop.droppableProps} className={`cards ${snap.isDraggingOver ? 'over' : ''}`}>
                    {list.cards.map((card, index) => {
                      const overdue = card.due_date && card.due_date < today() && list.title.toLowerCase() !== 'done';
                      return (
                        <Draggable key={card.id} draggableId={String(card.id)} index={index}>
                          {(drag, s) => (
                            <article
                              ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}
                              className={`card ${s.isDragging ? 'dragging' : ''}`}
                              onClick={() => setEditing(card)}
                            >
                              <p>{card.title}</p>
                              {card.due_date && <span className={`due ${overdue ? 'overdue' : ''}`}>Due {card.due_date}</span>}
                            </article>
                          )}
                        </Draggable>
                      );
                    })}
                    {drop.placeholder}
                  </div>
                )}
              </Droppable>

              <AddForm label="Add card" placeholder="Card title" onAdd={(t) => addCard(list.id, t)} />
            </section>
          ))}

          <div className="list new-list"><AddForm label="Add list" placeholder="List title" onAdd={addList} /></div>
        </div>
      </DragDropContext>

      {editing && <CardModal card={editing} onSave={saveCard} onDelete={deleteCard} onClose={() => setEditing(null)} />}
    </main>
  );
}
