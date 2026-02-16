import { Prisma } from '@prisma/client';

export type SearchType = 'board' | 'list' | 'task';

export interface SearchQueryInput {
  userId: string;
  query: string;
  boardId?: string;
  type?: SearchType;
  offset: number;
  limit: number;
}

export const buildSearchQueries = (input: SearchQueryInput): { rowsQuery: Prisma.Sql; countQuery: Prisma.Sql } => {
  const q = input.query.trim();
  // FIXED: Added ::uuid cast
  const boardFilter = input.boardId ? Prisma.sql`AND b.id = ${input.boardId}::uuid` : Prisma.empty;

  const boardSql = input.type && input.type !== 'board'
    ? Prisma.empty
    : Prisma.sql`
      SELECT
        'board' AS type,
        b.id,
        b.title,
        b.id AS board_id,
        b.title AS board_title,
        NULL::uuid AS list_id,
        NULL::text AS list_title,
        ts_rank(to_tsvector('english', coalesce(b.title, '') || ' ' || coalesce(b.description, '')), plainto_tsquery('english', ${q})) AS rank
      FROM "Board" b
      INNER JOIN "BoardMember" bm ON bm."boardId" = b.id
      WHERE to_tsvector('english', coalesce(b.title, '') || ' ' || coalesce(b.description, '')) @@ plainto_tsquery('english', ${q})
      AND bm."userId" = ${input.userId}::uuid
      ${boardFilter}
    `;

  const listSql = input.type && input.type !== 'list'
    ? Prisma.empty
    : Prisma.sql`
      SELECT
        'list' AS type,
        l.id,
        l.title,
        b.id AS board_id,
        b.title AS board_title,
        l.id AS list_id,
        l.title AS list_title,
        ts_rank(to_tsvector('english', coalesce(l.title, '')), plainto_tsquery('english', ${q})) AS rank
      FROM "List" l
      INNER JOIN "Board" b ON b.id = l."boardId"
      INNER JOIN "BoardMember" bm ON bm."boardId" = b.id
      WHERE to_tsvector('english', coalesce(l.title, '')) @@ plainto_tsquery('english', ${q})
      AND bm."userId" = ${input.userId}::uuid
      ${boardFilter}
    `;

  const taskSql = input.type && input.type !== 'task'
    ? Prisma.empty
    : Prisma.sql`
      SELECT
        'task' AS type,
        t.id,
        t.title,
        b.id AS board_id,
        b.title AS board_title,
        l.id AS list_id,
        l.title AS list_title,
        ts_rank(to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.description, '')), plainto_tsquery('english', ${q})) AS rank
      FROM "Task" t
      INNER JOIN "List" l ON l.id = t."listId"
      INNER JOIN "Board" b ON b.id = l."boardId"
      INNER JOIN "BoardMember" bm ON bm."boardId" = b.id
      WHERE to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.description, '')) @@ plainto_tsquery('english', ${q})
      AND bm."userId" = ${input.userId}::uuid
      ${boardFilter}
    `;

  const unions: Prisma.Sql[] = [];
  if (!(input.type && input.type !== 'board')) unions.push(boardSql);
  if (!(input.type && input.type !== 'list')) unions.push(listSql);
  if (!(input.type && input.type !== 'task')) unions.push(taskSql);

  const unionSql = Prisma.join(unions, ` UNION ALL `);

  const rowsQuery = Prisma.sql`
    WITH search_results AS (
      ${unionSql}
    )
    SELECT *
    FROM search_results
    ORDER BY rank DESC, title ASC
    OFFSET ${input.offset}
    LIMIT ${input.limit}
  `;

  const countQuery = Prisma.sql`
    WITH search_results AS (
      ${unionSql}
    )
    SELECT COUNT(*)::int AS total FROM search_results
  `;

  return { rowsQuery, countQuery };
};