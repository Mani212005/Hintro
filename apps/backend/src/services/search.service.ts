import { prisma } from '@/config/prisma.js';
import { buildSearchQueries, type SearchType } from '@/utils/search.js';
import { parsePagination, paginationMeta } from '@/utils/pagination.js';

interface SearchOptions {
  userId: string;
  query: string;
  boardId?: string;
  type?: SearchType;
  page?: number;
  limit?: number;
}

interface SearchRow {
  type: SearchType;
  id: string;
  title: string;
  board_id: string;
  board_title: string;
  list_id: string | null;
  list_title: string | null;
}

export const searchService = {
  async search(options: SearchOptions) {
    const pagination = parsePagination(options.page, options.limit);
    const offset = (pagination.page - 1) * pagination.limit;

    const { rowsQuery, countQuery } = buildSearchQueries({
      userId: options.userId,
      query: options.query,
      boardId: options.boardId,
      type: options.type,
      offset,
      limit: pagination.limit
    });

    const [rows, countRows] = await prisma.$transaction([
      prisma.$queryRaw<SearchRow[]>(rowsQuery),
      prisma.$queryRaw<Array<{ total: number }>>(countQuery)
    ]);

    const total = countRows[0]?.total ?? 0;

    return {
      results: rows.map((row) => ({
        type: row.type,
        id: row.id,
        title: row.title,
        board: {
          id: row.board_id,
          title: row.board_title
        },
        list: row.list_id
          ? {
              id: row.list_id,
              title: row.list_title
            }
          : null
      })),
      pagination: paginationMeta(pagination, total)
    };
  }
};
