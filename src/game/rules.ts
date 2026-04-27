export type Cell = string | null;

const defaultLineScores = [0, 100, 300, 500, 800];

export const calculateLevel = (lines: number): number => Math.floor(lines / 10) + 1;

export const calculateDropInterval = (
  level: number,
  baseDropIntervalMs = 650,
  minDropIntervalMs = 120,
): number => Math.max(minDropIntervalMs, baseDropIntervalMs - (level - 1) * 55);

export const calculateLineClearScore = (cleared: number, level: number): number => {
  const baseScore = defaultLineScores[cleared] ?? cleared * 200;
  return baseScore * level;
};

export const clearCompletedRows = (
  cells: Cell[],
  columns: number,
  rows: number,
): { cells: Cell[]; cleared: number } => {
  const remainingRows: Cell[][] = [];
  let cleared = 0;

  for (let row = 0; row < rows; row += 1) {
    const start = row * columns;
    const rowCells = cells.slice(start, start + columns);

    if (rowCells.every((cell) => cell !== null)) {
      cleared += 1;
    } else {
      remainingRows.push(rowCells);
    }
  }

  if (cleared === 0) {
    return { cells, cleared };
  }

  const emptyRows = Array.from({ length: cleared }, () => Array<Cell>(columns).fill(null));
  return { cells: [...emptyRows, ...remainingRows].flat(), cleared };
};
