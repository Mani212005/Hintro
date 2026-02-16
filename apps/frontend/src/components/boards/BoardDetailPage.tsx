import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AppFrame } from '@/components/layout/AppFrame';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  applyOptimisticMove,
  assignTask,
  clearOptimisticMove,
  createList,
  createTask,
  deleteList,
  deleteTask,
  fetchBoardById,
  moveTask,
  rollbackOptimisticMove,
  unassignTask,
  updateList,
  updateTask
} from '@/features/boards/boardsSlice';
import { fetchActivity } from '@/features/activity/activitySlice';
import { clearSearch, searchEntities } from '@/features/search/searchSlice';
import { setSocketConnected } from '@/features/socket/socketSlice';
import { connectSocket, disconnectSocket, getSocket, joinBoardRoom, leaveBoardRoom } from '@/services/socket';
import { DroppableList } from './dnd/DroppableList';
import { SortableTaskCard } from './dnd/SortableTaskCard';
import { formatRelativeDate } from '@/utils/date';

interface TaskLocation {
  listId: string;
  index: number;
}

const parseTaskId = (value: string): string | null => (value.startsWith('task-') ? value.replace('task-', '') : null);
const parseListId = (value: string): string | null => (value.startsWith('list-') ? value.replace('list-', '') : null);

export const BoardDetailPage = () => {
  const dispatch = useAppDispatch();
  const { boardId = '' } = useParams<{ boardId: string }>();

  const { currentBoard, boardStatus, error } = useAppSelector((state) => state.boards);
  const { user, token } = useAppSelector((state) => state.auth);
  const { items: activityItems } = useAppSelector((state) => state.activity);
  const { results, query: activeQuery, status: searchStatus } = useAppSelector((state) => state.search);
  const socketConnected = useAppSelector((state) => state.socket.connected);

  const [newListTitle, setNewListTitle] = useState('');
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (!boardId) {
      return;
    }

    void dispatch(fetchBoardById(boardId));
    void dispatch(fetchActivity({ boardId }));

    return () => {
      dispatch(clearSearch());
    };
  }, [dispatch, boardId]);

  useEffect(() => {
    if (!token || !boardId) {
      return;
    }

    const socket = connectSocket(token);

    const refreshBoard = () => {
      void dispatch(fetchBoardById(boardId));
      void dispatch(fetchActivity({ boardId }));
    };

    const onConnect = () => {
      dispatch(setSocketConnected(true));
      joinBoardRoom(boardId);
    };

    const onDisconnect = () => {
      dispatch(setSocketConnected(false));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('board_updated', refreshBoard);
    socket.on('task_created', refreshBoard);
    socket.on('task_updated', refreshBoard);
    socket.on('task_deleted', refreshBoard);
    socket.on('task_moved', refreshBoard);
    socket.on('activity_logged', refreshBoard);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      leaveBoardRoom(boardId);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('board_updated', refreshBoard);
      socket.off('task_created', refreshBoard);
      socket.off('task_updated', refreshBoard);
      socket.off('task_deleted', refreshBoard);
      socket.off('task_moved', refreshBoard);
      socket.off('activity_logged', refreshBoard);

      const currentSocket = getSocket();
      if (currentSocket && !window.location.pathname.includes('/boards/')) {
        disconnectSocket();
      }
    };
  }, [dispatch, token, boardId]);

  const taskLocationById = useMemo(() => {
    const map = new Map<string, TaskLocation>();

    if (!currentBoard) {
      return map;
    }

    currentBoard.lists.forEach((list) => {
      list.tasks.forEach((task, index) => {
        map.set(task.id, { listId: list.id, index });
      });
    });

    return map;
  }, [currentBoard]);

  const resolveDestination = (overId: string): TaskLocation | null => {
    const taskId = parseTaskId(overId);
    if (taskId) {
      return taskLocationById.get(taskId) || null;
    }

    const listId = parseListId(overId);
    if (!listId || !currentBoard) {
      return null;
    }

    const list = currentBoard.lists.find((entry) => entry.id === listId);
    if (!list) {
      return null;
    }

    return {
      listId,
      index: list.tasks.length
    };
  };

  const onDragEnd = async (event: DragEndEvent) => {
    if (!currentBoard) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    const taskId = parseTaskId(activeId);
    if (!taskId || !overId) {
      return;
    }

    const source = taskLocationById.get(taskId);
    const destination = resolveDestination(overId);

    if (!source || !destination) {
      return;
    }

    if (source.listId === destination.listId && source.index === destination.index) {
      return;
    }

    dispatch(
      applyOptimisticMove({
        taskId,
        sourceListId: source.listId,
        destinationListId: destination.listId,
        destinationIndex: destination.index
      })
    );

    const result = await dispatch(
      moveTask({
        taskId,
        destinationListId: destination.listId,
        destinationIndex: destination.index
      })
    );

    if (moveTask.rejected.match(result)) {
      dispatch(rollbackOptimisticMove());
      await dispatch(fetchBoardById(boardId));
      return;
    }

    dispatch(clearOptimisticMove());
  };

  const submitList = async (event: FormEvent) => {
    event.preventDefault();
    if (!boardId || !newListTitle.trim()) {
      return;
    }

    const result = await dispatch(
      createList({
        boardId,
        title: newListTitle.trim()
      })
    );

    if (createList.fulfilled.match(result)) {
      setNewListTitle('');
    }
  };

  const submitTask = async (event: FormEvent, listId: string) => {
    event.preventDefault();
    const title = taskDrafts[listId]?.trim();
    if (!title) {
      return;
    }

    const result = await dispatch(
      createTask({
        listId,
        title
      })
    );

    if (createTask.fulfilled.match(result)) {
      setTaskDrafts((current) => ({ ...current, [listId]: '' }));
    }
  };

  const submitSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      dispatch(clearSearch());
      return;
    }

    await dispatch(
      searchEntities({
        query: searchQuery.trim(),
        boardId
      })
    );
  };

  if (!boardId) {
    return (
      <AppFrame title="Board" subtitle="Missing board identifier.">
        <p className="form-error">Invalid board URL.</p>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      title={currentBoard?.title || 'Board'}
      subtitle={currentBoard?.description || 'Manage lists and tasks with realtime updates.'}
    >
      <div className="board-page-grid">
        <section className="panel board-main">
          <div className="row wrap spaced">
            <p className="muted">
              {socketConnected ? 'Realtime connected' : 'Realtime disconnected'}
            </p>
            <Link className="ghost" to="/">
              Back to boards
            </Link>
          </div>

          <form className="row wrap" onSubmit={submitList}>
            <input
              value={newListTitle}
              onChange={(event) => setNewListTitle(event.target.value)}
              placeholder="Add a new list"
            />
            <button className="primary" type="submit" disabled={!newListTitle.trim()}>
              Add list
            </button>
          </form>

          {boardStatus === 'loading' ? <p className="muted">Loading board...</p> : null}
          {error ? <p className="form-error">{error}</p> : null}

          {currentBoard ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void onDragEnd(event)}>
              <div className="lists-row">
                {currentBoard.lists.map((list) => (
                  <DroppableList key={list.id} listId={list.id}>
                    <div className="list-header">
                      <h3>{list.title}</h3>
                      <div className="row">
                        <button
                          className="ghost"
                          onClick={() => {
                            const title = window.prompt('Rename list', list.title);
                            if (title && title.trim()) {
                              void dispatch(updateList({ listId: list.id, title: title.trim() }));
                            }
                          }}
                        >
                          Rename
                        </button>
                        <button className="ghost danger" onClick={() => void dispatch(deleteList(list.id))}>
                          Delete
                        </button>
                      </div>
                    </div>

                    <form className="row" onSubmit={(event) => void submitTask(event, list.id)}>
                      <input
                        value={taskDrafts[list.id] || ''}
                        onChange={(event) =>
                          setTaskDrafts((current) => ({
                            ...current,
                            [list.id]: event.target.value
                          }))
                        }
                        placeholder="New task title"
                      />
                      <button type="submit" className="ghost" disabled={!taskDrafts[list.id]?.trim()}>
                        Add
                      </button>
                    </form>

                    <SortableContext
                      items={list.tasks.map((task) => `task-${task.id}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="task-list">
                        {list.tasks.map((task) => (
                          <SortableTaskCard
                            key={task.id}
                            task={task}
                            currentUserId={user?.id || ''}
                            onSave={async (updates) => {
                              await dispatch(updateTask({ taskId: task.id, ...updates }));
                            }}
                            onDelete={async () => {
                              await dispatch(deleteTask(task.id));
                            }}
                            onAssignSelf={async () => {
                              if (user?.id) {
                                await dispatch(assignTask({ taskId: task.id, userId: user.id }));
                              }
                            }}
                            onUnassignSelf={async () => {
                              if (user?.id) {
                                await dispatch(unassignTask({ taskId: task.id, userId: user.id }));
                              }
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DroppableList>
                ))}
              </div>
            </DndContext>
          ) : null}
        </section>

        <aside className="stack">
          <article className="panel">
            <h2>Search this board</h2>
            <form className="stack" onSubmit={submitSearch}>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search boards, lists, tasks"
              />
              <div className="row wrap">
                <button className="primary" type="submit" disabled={!searchQuery.trim()}>
                  Search
                </button>
                <button type="button" className="ghost" onClick={() => dispatch(clearSearch())}>
                  Clear
                </button>
              </div>
            </form>

            {searchStatus === 'loading' ? <p className="muted">Searching...</p> : null}
            {activeQuery ? <p className="muted">Results for "{activeQuery}"</p> : null}
            <ul className="result-list">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <strong>{result.title}</strong>
                  <span>
                    {result.type} in {result.board.title}
                  </span>
                </li>
              ))}
              {!results.length && activeQuery ? <li className="muted">No results</li> : null}
            </ul>
          </article>

          <article className="panel">
            <div className="row spaced">
              <h2>Activity</h2>
              <button className="ghost" onClick={() => void dispatch(fetchActivity({ boardId }))}>
                Refresh
              </button>
            </div>

            <ul className="activity-list">
              {activityItems.map((activity) => (
                <li key={activity.id}>
                  <p>
                    <strong>{activity.user?.name || 'System'}</strong> {activity.action_type.replaceAll('_', ' ')}
                  </p>
                  <span>{formatRelativeDate(activity.created_at)}</span>
                </li>
              ))}
              {!activityItems.length ? <li className="muted">No activity yet.</li> : null}
            </ul>
          </article>
        </aside>
      </div>
    </AppFrame>
  );
};
