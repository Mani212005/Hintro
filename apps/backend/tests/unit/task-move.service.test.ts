import { calculateMoveTarget } from '@/utils/task-move.js';

describe('task move target calculation', () => {
  it('caps same-list moves to source bounds', () => {
    expect(
      calculateMoveTarget({
        sameList: true,
        targetPosition: 99,
        sourceCount: 5,
        destinationCount: 5
      })
    ).toBe(4);

    expect(
      calculateMoveTarget({
        sameList: true,
        targetPosition: -4,
        sourceCount: 5,
        destinationCount: 5
      })
    ).toBe(0);
  });

  it('caps cross-list moves to destination bounds', () => {
    expect(
      calculateMoveTarget({
        sameList: false,
        targetPosition: 99,
        sourceCount: 5,
        destinationCount: 2
      })
    ).toBe(2);
  });
});
