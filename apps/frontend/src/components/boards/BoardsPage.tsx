import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppFrame } from '@/components/layout/AppFrame';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createBoard, fetchBoards } from '@/features/boards/boardsSlice';

export const BoardsPage = () => {
  const dispatch = useAppDispatch();
  const { boards, status, error } = useAppSelector((state) => state.boards);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    void dispatch(fetchBoards(undefined));
  }, [dispatch]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    const result = await dispatch(
      createBoard({
        title: title.trim(),
        description: description.trim() || undefined
      })
    );

    if (createBoard.fulfilled.match(result)) {
      setTitle('');
      setDescription('');
    }
  };

  return (
    <AppFrame title="Your Boards" subtitle="Create and manage collaborative boards for your team.">
      <section className="boards-grid">
        <article className="panel">
          <h2>Create board</h2>
          <form className="stack" onSubmit={submit}>
            <label>
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Project Alpha"
              />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Main project board"
                rows={4}
              />
            </label>

            <button type="submit" className="primary" disabled={!title.trim()}>
              Create board
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Board directory</h2>

          {status === 'loading' ? <p className="muted">Loading boards...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}

          <div className="board-list">
            {boards.map((board) => (
              <Link key={board.id} className="board-item" to={`/boards/${board.id}`}>
                <div>
                  <h3>{board.title}</h3>
                  <p>{board.description || 'No description'}</p>
                </div>
                <span>{board.members_count ?? 1} members</span>
              </Link>
            ))}

            {!boards.length && status !== 'loading' ? (
              <p className="muted">No boards yet. Create one to start collaborating.</p>
            ) : null}
          </div>
        </article>
      </section>
    </AppFrame>
  );
};
