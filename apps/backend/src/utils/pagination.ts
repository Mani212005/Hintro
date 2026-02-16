import type { PaginationMeta } from '@taskflow/shared-types';

export interface PaginationParams {
  page: number;
  limit: number;
}

const MAX_LIMIT = 100;

export const parsePagination = (page?: number, limit?: number): PaginationParams => {
  const parsedPage = page && Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const parsedLimit = limit && Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), MAX_LIMIT) : 20;

  return { page: parsedPage, limit: parsedLimit };
};

export const paginationMeta = (params: PaginationParams, total: number): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(total / params.limit));

  return {
    page: params.page,
    limit: params.limit,
    total,
    total_pages: totalPages,
    has_next: params.page < totalPages,
    has_prev: params.page > 1
  };
};
