import './styles/app.css';

type Screen = 'title' | 'game' | 'pause' | 'gameOver' | 'controls';
type Cell = string | null;
type Point = { x: number; y: number };
type Piece = {
  cells: Point[];
  color: string;
  x: number;
  y: number;
};
type PieceDefinition = {
  cells: Point[];
  color: string;
};

const boardColumns = 10;
const boardRows = 20;
const dropIntervalMs = 650;
const palette = {
  active: '#79d3c8',
  fixed: '#f2c14e',
  ghost: '#8aa1b5',
  next: '#ef476f',
  hold: '#6c8cff',
};
const pieces: PieceDefinition[] = [
  {
    color: palette.active,
    cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  },
  {
    color: '#ef476f',
    cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }],
  },
  {
    color: '#6c8cff',
    cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  },
  {
    color: '#f2c14e',
    cells: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  },
  {
    color: '#4ecdc4',
    cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  },
  {
    color: '#9b5de5',
    cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  },
  {
    color: '#06d6a0',
    cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
  },
];

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element was not found.');
}

const root = app;

let currentScreen: Screen = 'title';
let previousScreen: Screen = 'title';
let boardCells: Cell[] = Array<Cell>(boardColumns * boardRows).fill(null);
let currentPiece: Piece | null = null;
let lastDropTime = 0;

const setScreen = (screen: Screen): void => {
  if (screen !== 'pause' && screen !== 'controls') {
    previousScreen = screen;
  }
  currentScreen = screen;
  render();
};

const openControls = (): void => {
  previousScreen = currentScreen;
  currentScreen = 'controls';
  render();
};

const getCellIndex = (x: number, y: number): number => y * boardColumns + x;

const createPiece = (): Piece => {
  const definition = pieces[Math.floor(Math.random() * pieces.length)];
  const maxX = Math.max(...definition.cells.map((cell) => cell.x));

  return {
    cells: definition.cells.map((cell) => ({ ...cell })),
    color: definition.color,
    x: Math.floor((boardColumns - maxX - 1) / 2),
    y: 0,
  };
};

const collides = (piece: Piece, offset: Point = { x: 0, y: 0 }): boolean =>
  piece.cells.some((cell) => {
    const x = piece.x + cell.x + offset.x;
    const y = piece.y + cell.y + offset.y;

    if (x < 0 || x >= boardColumns || y >= boardRows) {
      return true;
    }
    if (y < 0) {
      return false;
    }

    return boardCells[getCellIndex(x, y)] !== null;
  });

const resetGame = (): void => {
  boardCells = Array<Cell>(boardColumns * boardRows).fill(null);
  currentPiece = createPiece();
  lastDropTime = performance.now();
};

const lockPiece = (piece: Piece): void => {
  piece.cells.forEach((cell) => {
    const x = piece.x + cell.x;
    const y = piece.y + cell.y;

    if (y >= 0 && y < boardRows && x >= 0 && x < boardColumns) {
      boardCells[getCellIndex(x, y)] = piece.color;
    }
  });
};

const spawnNextPiece = (): void => {
  const nextPiece = createPiece();
  if (collides(nextPiece)) {
    currentPiece = null;
    currentScreen = 'gameOver';
    render();
    return;
  }

  currentPiece = nextPiece;
};

const stepGame = (): void => {
  if (currentScreen !== 'game' || !currentPiece) {
    return;
  }

  if (!collides(currentPiece, { x: 0, y: 1 })) {
    currentPiece.y += 1;
  } else {
    lockPiece(currentPiece);
    spawnNextPiece();
  }

  render();
};

const updateGame = (timestamp: number): void => {
  if (timestamp - lastDropTime >= dropIntervalMs) {
    lastDropTime = timestamp;
    stepGame();
  }

  window.requestAnimationFrame(updateGame);
};

const renderTitle = (): string => `
  <main class="screen title-screen" aria-labelledby="app-title">
    <div class="title-copy">
      <p class="eyebrow">PC Browser Puzzle</p>
      <h1 id="app-title">Falling Blocks</h1>
      <p class="summary">Keyboard and Gamepad API ready static web game.</p>
    </div>
    <nav class="menu-actions" aria-label="Title menu">
      <button type="button" data-action="start">Start Game</button>
      <button type="button" data-action="controls">Controls</button>
    </nav>
    <dl class="status-grid" aria-label="Status">
      <div>
        <dt>Keyboard</dt>
        <dd>Ready</dd>
      </div>
      <div>
        <dt>Gamepad</dt>
        <dd>Not Connected</dd>
      </div>
      <div>
        <dt>High Score</dt>
        <dd>000000</dd>
      </div>
    </dl>
  </main>
`;

const renderGame = (overlay?: 'pause' | 'gameOver'): string => `
  <main class="game-shell" aria-labelledby="game-title">
    <header class="game-header">
      <h1 id="game-title">Falling Blocks</h1>
      <div class="header-status">
        <span>Keyboard: Ready</span>
        <span>Gamepad: Not Connected</span>
      </div>
    </header>

    <section class="game-layout" aria-label="Game layout">
      <aside class="side-panel">
        <section class="panel">
          <h2>Hold</h2>
          <canvas class="mini-canvas" width="128" height="128" data-canvas="hold" aria-label="Hold block preview"></canvas>
        </section>
        <section class="panel stats-panel">
          <h2>Score</h2>
          <strong>012340</strong>
          <h2>Lines</h2>
          <strong>18</strong>
        </section>
      </aside>

      <section class="board-wrap" aria-label="Main board">
        <canvas class="board-canvas" width="320" height="640" data-canvas="board" aria-label="Main board preview"></canvas>
      </section>

      <aside class="side-panel">
        <section class="panel">
          <h2>Next</h2>
          <canvas class="mini-canvas" width="128" height="128" data-canvas="next" aria-label="Next block preview"></canvas>
        </section>
        <section class="panel stats-panel">
          <h2>Level</h2>
          <strong>03</strong>
        </section>
        <section class="panel controls-panel">
          <h2>Controls</h2>
          <p>Move: Left / Right</p>
          <p>Rotate: Up / Z</p>
          <p>Drop: Down / Space</p>
          <p>Hold: C / Shift</p>
        </section>
      </aside>
    </section>

    <footer class="game-actions">
      <button type="button" data-action="pause">Pause</button>
      <button type="button" data-action="game-over">End Run</button>
      <button type="button" data-action="title">Title</button>
    </footer>

    ${overlay === 'pause' ? renderPauseOverlay() : ''}
    ${overlay === 'gameOver' ? renderGameOverOverlay() : ''}
  </main>
`;

const renderPauseOverlay = (): string => `
  <section class="modal-layer" role="dialog" aria-modal="true" aria-labelledby="pause-title">
    <div class="modal-panel">
      <h2 id="pause-title">Paused</h2>
      <div class="modal-actions">
        <button type="button" data-action="resume">Resume</button>
        <button type="button" data-action="restart">Restart</button>
        <button type="button" data-action="controls">Controls</button>
        <button type="button" data-action="title">Title</button>
      </div>
    </div>
  </section>
`;

const renderGameOverOverlay = (): string => `
  <section class="modal-layer" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
    <div class="modal-panel score-modal">
      <h2 id="game-over-title">Game Over</h2>
      <dl>
        <div><dt>Score</dt><dd>024500</dd></div>
        <div><dt>Lines</dt><dd>42</dd></div>
        <div><dt>Level</dt><dd>06</dd></div>
        <div><dt>High Score</dt><dd>024500</dd></div>
      </dl>
      <div class="modal-actions">
        <button type="button" data-action="restart">Restart</button>
        <button type="button" data-action="title">Title</button>
      </div>
    </div>
  </section>
`;

const renderControls = (): string => `
  <main class="screen controls-screen" aria-labelledby="controls-title">
    <header class="screen-header">
      <p class="eyebrow">Input</p>
      <h1 id="controls-title">Controls</h1>
    </header>
    <section class="controls-grid">
      <article class="control-card">
        <h2>Keyboard</h2>
        <dl>
          <div><dt>Left / A</dt><dd>Move Left</dd></div>
          <div><dt>Right / D</dt><dd>Move Right</dd></div>
          <div><dt>Down / S</dt><dd>Soft Drop</dd></div>
          <div><dt>Up / W / X</dt><dd>Rotate Clockwise</dd></div>
          <div><dt>Z</dt><dd>Rotate Counterclockwise</dd></div>
          <div><dt>Space</dt><dd>Hard Drop</dd></div>
          <div><dt>C / Shift</dt><dd>Hold</dd></div>
          <div><dt>Esc / P</dt><dd>Pause</dd></div>
        </dl>
      </article>
      <article class="control-card">
        <h2>Controller</h2>
        <dl>
          <div><dt>D-Pad / Left Stick</dt><dd>Move / Soft Drop</dd></div>
          <div><dt>A / B</dt><dd>Rotate</dd></div>
          <div><dt>X / Y</dt><dd>Hard Drop</dd></div>
          <div><dt>L / R</dt><dd>Hold</dd></div>
          <div><dt>+</dt><dd>Pause</dd></div>
        </dl>
        <p class="connection-state">Gamepad Status: Not Connected</p>
      </article>
    </section>
    <button type="button" data-action="back">Back</button>
  </main>
`;

function render(): void {
  if (currentScreen === 'title') {
    root.innerHTML = renderTitle();
  } else if (currentScreen === 'game') {
    root.innerHTML = renderGame();
  } else if (currentScreen === 'pause') {
    root.innerHTML = renderGame('pause');
  } else if (currentScreen === 'gameOver') {
    root.innerHTML = renderGame('gameOver');
  } else {
    root.innerHTML = renderControls();
  }

  drawCanvases();
}

const mergePieceCells = (cells: Cell[], piece: Piece, color: string): void => {
  piece.cells.forEach((cell) => {
    const x = piece.x + cell.x;
    const y = piece.y + cell.y;

    if (y >= 0 && y < boardRows && x >= 0 && x < boardColumns) {
      cells[getCellIndex(x, y)] = color;
    }
  });
};

const createBoardCells = (): Cell[] => {
  const cells = [...boardCells];

  if (!currentPiece) {
    return cells;
  }

  const ghostPiece: Piece = {
    ...currentPiece,
    cells: currentPiece.cells.map((cell) => ({ ...cell })),
  };

  while (!collides(ghostPiece, { x: 0, y: 1 })) {
    ghostPiece.y += 1;
  }

  mergePieceCells(cells, ghostPiece, palette.ghost);
  mergePieceCells(cells, currentPiece, currentPiece.color);
  return cells;
};

const createMiniCells = (filled: number[], color: string): Cell[] => {
  const cells = Array<Cell>(16).fill(null);
  filled.forEach((index) => {
    cells[index] = color;
  });
  return cells;
};

const drawGridCanvas = (
  canvas: HTMLCanvasElement,
  columns: number,
  rows: number,
  cells: Cell[],
): void => {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const cellWidth = canvas.width / columns;
  const cellHeight = canvas.height / rows;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(0, 0, 0, 0.28)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  cells.forEach((color, index) => {
    if (!color) {
      return;
    }

    const x = (index % columns) * cellWidth;
    const y = Math.floor(index / columns) * cellHeight;
    context.fillStyle = color;
    context.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(x + 1, y + 1, cellWidth - 2, 3);
    context.fillStyle = 'rgba(16, 24, 32, 0.3)';
    context.fillRect(x + 1, y + cellHeight - 4, cellWidth - 2, 3);
  });

  context.strokeStyle = 'rgba(237, 245, 255, 0.08)';
  context.lineWidth = 1;

  for (let column = 0; column <= columns; column += 1) {
    const x = Math.round(column * cellWidth) + 0.5;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }

  for (let row = 0; row <= rows; row += 1) {
    const y = Math.round(row * cellHeight) + 0.5;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
};

const drawCanvases = (): void => {
  const board = root.querySelector<HTMLCanvasElement>('[data-canvas="board"]');
  const hold = root.querySelector<HTMLCanvasElement>('[data-canvas="hold"]');
  const next = root.querySelector<HTMLCanvasElement>('[data-canvas="next"]');

  if (board) {
    drawGridCanvas(board, boardColumns, boardRows, createBoardCells());
  }
  if (hold) {
    drawGridCanvas(hold, 4, 4, createMiniCells([1, 5, 9, 13], palette.hold));
  }
  if (next) {
    drawGridCanvas(next, 4, 4, createMiniCells([4, 5, 6, 9], palette.next));
  }
};

root.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const action = target.dataset.action;

  if (action === 'start' || action === 'restart') {
    resetGame();
    setScreen('game');
  } else if (action === 'controls') {
    openControls();
  } else if (action === 'pause') {
    currentScreen = 'pause';
    render();
  } else if (action === 'resume') {
    setScreen('game');
  } else if (action === 'game-over') {
    currentScreen = 'gameOver';
    render();
  } else if (action === 'title') {
    setScreen('title');
  } else if (action === 'back') {
    setScreen(previousScreen === 'controls' ? 'title' : previousScreen);
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
    if (currentScreen === 'game') {
      currentScreen = 'pause';
      render();
    } else if (currentScreen === 'pause') {
      setScreen('game');
    }
  }
});

render();
window.requestAnimationFrame(updateGame);
