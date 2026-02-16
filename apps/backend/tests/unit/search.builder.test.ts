import { buildSearchQueries } from '@/utils/search.js';

describe('search query builder', () => {
  it('includes user and board filters in query values', () => {
    const { rowsQuery } = buildSearchQueries({
      userId: '11111111-1111-1111-1111-111111111111',
      query: 'login',
      boardId: '22222222-2222-2222-2222-222222222222',
      offset: 0,
      limit: 20
    });

    const values = (rowsQuery as unknown as { values?: unknown[] }).values ?? [];
    expect(values).toContain('11111111-1111-1111-1111-111111111111');
    expect(values).toContain('22222222-2222-2222-2222-222222222222');
    expect(values).toContain('login');
  });

  it('builds type-specific query', () => {
    const { rowsQuery } = buildSearchQueries({
      userId: '11111111-1111-1111-1111-111111111111',
      query: 'task',
      type: 'task',
      offset: 10,
      limit: 10
    });

    const values = (rowsQuery as unknown as { values?: unknown[] }).values ?? [];
    expect(values).toContain('11111111-1111-1111-1111-111111111111');
    expect(values).toContain('task');
    expect(values).toContain(10);
  });
});
