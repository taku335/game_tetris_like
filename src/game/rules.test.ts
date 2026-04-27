import { describe, expect, it } from 'vitest';
import {
  calculateDropInterval,
  calculateLevel,
  calculateLineClearScore,
  clearCompletedRows,
} from './rules';
import type { Cell } from './rules';

describe('game rules', () => {
  it('clears completed rows and keeps remaining rows in order', () => {
    const cells: Cell[] = [
      null, 'a', null, 'b',
      'c', 'c', 'c', 'c',
      'd', null, null, 'd',
      'e', 'e', 'e', 'e',
    ];

    const result = clearCompletedRows(cells, 4, 4);

    expect(result.cleared).toBe(2);
    expect(result.cells).toEqual([
      null, null, null, null,
      null, null, null, null,
      null, 'a', null, 'b',
      'd', null, null, 'd',
    ]);
  });

  it('does not allocate a changed board when no rows are complete', () => {
    const cells: Cell[] = [null, 'a', 'b', null];

    const result = clearCompletedRows(cells, 2, 2);

    expect(result.cleared).toBe(0);
    expect(result.cells).toBe(cells);
  });

  it('calculates level from total cleared lines', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(9)).toBe(1);
    expect(calculateLevel(10)).toBe(2);
    expect(calculateLevel(29)).toBe(3);
  });

  it('calculates line clear score using level multiplier', () => {
    expect(calculateLineClearScore(1, 1)).toBe(100);
    expect(calculateLineClearScore(2, 2)).toBe(600);
    expect(calculateLineClearScore(4, 3)).toBe(2400);
  });

  it('reduces drop interval by level without going under the minimum', () => {
    expect(calculateDropInterval(1, 650, 120)).toBe(650);
    expect(calculateDropInterval(3, 650, 120)).toBe(540);
    expect(calculateDropInterval(99, 650, 120)).toBe(120);
  });
});
