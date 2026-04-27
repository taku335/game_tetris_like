import './styles/app.css';

type Screen = 'title' | 'game' | 'pause' | 'gameOver' | 'controls';
type Cell = string | null;
type Point = { x: number; y: number };
type Piece = {
  definition: PieceDefinition;
  cells: Point[];
  color: string;
  x: number;
  y: number;
};
type PieceDefinition = {
  cells: Point[];
  color: string;
};
type InputAction =
  | 'moveLeft'
  | 'moveRight'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateClockwise'
  | 'rotateCounterclockwise'
  | 'hold'
  | 'pause';
type GamepadButtonBinding = {
  button: number;
  action: InputAction;
  repeat: boolean;
};
type GamepadAxisBinding = {
  axis: number;
  direction: -1 | 1;
  action: InputAction;
};

const boardColumns = 10;
const boardRows = 20;
const baseDropIntervalMs = 650;
const minDropIntervalMs = 120;
const inputRepeatMs = 120;
const gamepadAxisThreshold = 0.55;
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
let holdPiece: PieceDefinition | null = null;
let nextQueue: PieceDefinition[] = [];
let canHold = true;
let lastDropTime = 0;
let score = 0;
let lines = 0;
let level = 1;
const keyboardMap = new Map<string, InputAction>([
  ['ArrowLeft', 'moveLeft'],
  ['KeyA', 'moveLeft'],
  ['ArrowRight', 'moveRight'],
  ['KeyD', 'moveRight'],
  ['ArrowDown', 'softDrop'],
  ['KeyS', 'softDrop'],
  ['Space', 'hardDrop'],
  ['ArrowUp', 'rotateClockwise'],
  ['KeyW', 'rotateClockwise'],
  ['KeyX', 'rotateClockwise'],
  ['KeyZ', 'rotateCounterclockwise'],
  ['KeyC', 'hold'],
  ['ShiftLeft', 'hold'],
  ['ShiftRight', 'hold'],
  ['Escape', 'pause'],
  ['KeyP', 'pause'],
]);
const gamepadButtonMap: GamepadButtonBinding[] = [
  { button: 14, action: 'moveLeft', repeat: true },
  { button: 15, action: 'moveRight', repeat: true },
  { button: 13, action: 'softDrop', repeat: true },
  { button: 0, action: 'rotateClockwise', repeat: false },
  { button: 1, action: 'rotateCounterclockwise', repeat: false },
  { button: 2, action: 'hardDrop', repeat: false },
  { button: 3, action: 'hardDrop', repeat: false },
  { button: 4, action: 'hold', repeat: false },
  { button: 5, action: 'hold', repeat: false },
  { button: 9, action: 'pause', repeat: false },
];
const gamepadAxisMap: GamepadAxisBinding[] = [
  { axis: 0, direction: -1, action: 'moveLeft' },
  { axis: 0, direction: 1, action: 'moveRight' },
  { axis: 1, direction: 1, action: 'softDrop' },
];
const pressedGamepadButtons = new Set<number>();
const buttonRepeatTimes = new Map<string, number>();
const axisRepeatTimes = new Map<string, number>();
let activeGamepadIndex: number | null = null;
let activeGamepadName: string | null = null;

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

const getGamepadStatusText = (): string =>
  activeGamepadName ? `Connected: ${activeGamepadName}` : 'Not Connected';

const getCellIndex = (x: number, y: number): number => y * boardColumns + x;

const randomPieceDefinition = (): PieceDefinition =>
  pieces[Math.floor(Math.random() * pieces.length)];

const createPiece = (definition = randomPieceDefinition()): Piece => {
  const maxX = Math.max(...definition.cells.map((cell) => cell.x));

  return {
    definition,
    cells: definition.cells.map((cell) => ({ ...cell })),
    color: definition.color,
    x: Math.floor((boardColumns - maxX - 1) / 2),
    y: 0,
  };
};

const fillNextQueue = (): void => {
  while (nextQueue.length < 3) {
    nextQueue.push(randomPieceDefinition());
  }
};

const takeNextPiece = (): Piece => {
  fillNextQueue();
  const nextDefinition = nextQueue.shift() ?? randomPieceDefinition();
  fillNextQueue();
  return createPiece(nextDefinition);
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
  nextQueue = [];
  fillNextQueue();
  currentPiece = takeNextPiece();
  holdPiece = null;
  canHold = true;
  score = 0;
  lines = 0;
  level = 1;
  lastDropTime = performance.now();
};

const getDropInterval = (): number =>
  Math.max(minDropIntervalMs, baseDropIntervalMs - (level - 1) * 55);

const addScore = (points: number): void => {
  score += points * level;
};

const clearCompletedLines = (): void => {
  const remainingRows: Cell[][] = [];
  let cleared = 0;

  for (let row = 0; row < boardRows; row += 1) {
    const start = row * boardColumns;
    const rowCells = boardCells.slice(start, start + boardColumns);

    if (rowCells.every((cell) => cell !== null)) {
      cleared += 1;
    } else {
      remainingRows.push(rowCells);
    }
  }

  if (cleared === 0) {
    return;
  }

  const emptyRows = Array.from({ length: cleared }, () =>
    Array<Cell>(boardColumns).fill(null),
  );
  boardCells = [...emptyRows, ...remainingRows].flat();
  lines += cleared;
  level = Math.floor(lines / 10) + 1;

  const lineScores = [0, 100, 300, 500, 800];
  addScore(lineScores[cleared] ?? cleared * 200);
};

const lockPiece = (piece: Piece): void => {
  piece.cells.forEach((cell) => {
    const x = piece.x + cell.x;
    const y = piece.y + cell.y;

    if (y >= 0 && y < boardRows && x >= 0 && x < boardColumns) {
      boardCells[getCellIndex(x, y)] = piece.color;
    }
  });
  clearCompletedLines();
};

const spawnNextPiece = (): void => {
  const nextPiece = takeNextPiece();
  if (collides(nextPiece)) {
    currentPiece = null;
    currentScreen = 'gameOver';
    render();
    return;
  }

  currentPiece = nextPiece;
  canHold = true;
};

const moveCurrentPiece = (dx: number, dy: number): boolean => {
  if (currentScreen !== 'game' || !currentPiece || collides(currentPiece, { x: dx, y: dy })) {
    return false;
  }

  currentPiece.x += dx;
  currentPiece.y += dy;
  render();
  return true;
};

const rotateCells = (piece: Piece, clockwise: boolean): Point[] => {
  const maxX = Math.max(...piece.cells.map((cell) => cell.x));
  const maxY = Math.max(...piece.cells.map((cell) => cell.y));
  const rotated = piece.cells.map((cell) =>
    clockwise
      ? { x: maxY - cell.y, y: cell.x }
      : { x: cell.y, y: maxX - cell.x },
  );
  const minX = Math.min(...rotated.map((cell) => cell.x));
  const minY = Math.min(...rotated.map((cell) => cell.y));

  return rotated.map((cell) => ({ x: cell.x - minX, y: cell.y - minY }));
};

const rotateCurrentPiece = (clockwise: boolean): void => {
  if (currentScreen !== 'game' || !currentPiece) {
    return;
  }

  const rotatedPiece: Piece = {
    ...currentPiece,
    cells: rotateCells(currentPiece, clockwise),
  };
  const wallKicks = [0, -1, 1, -2, 2];
  const kick = wallKicks.find((dx) => !collides(rotatedPiece, { x: dx, y: 0 }));

  if (kick === undefined) {
    return;
  }

  currentPiece.cells = rotatedPiece.cells;
  currentPiece.x += kick;
  render();
};

const hardDropCurrentPiece = (): void => {
  if (currentScreen !== 'game' || !currentPiece) {
    return;
  }

  let droppedRows = 0;
  while (!collides(currentPiece, { x: 0, y: 1 })) {
    currentPiece.y += 1;
    droppedRows += 1;
  }

  addScore(droppedRows * 2);
  lockPiece(currentPiece);
  spawnNextPiece();
  render();
};

const holdCurrentPiece = (): void => {
  if (currentScreen !== 'game' || !currentPiece || !canHold) {
    return;
  }

  const heldDefinition = holdPiece;
  holdPiece = currentPiece.definition;

  if (heldDefinition) {
    currentPiece = createPiece(heldDefinition);
    if (collides(currentPiece)) {
      currentPiece = null;
      currentScreen = 'gameOver';
    }
  } else {
    currentPiece = takeNextPiece();
    if (collides(currentPiece)) {
      currentPiece = null;
      currentScreen = 'gameOver';
    }
  }

  canHold = false;
  render();
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

const applyInputAction = (action: InputAction): void => {
  if (action === 'moveLeft') {
    moveCurrentPiece(-1, 0);
  } else if (action === 'moveRight') {
    moveCurrentPiece(1, 0);
  } else if (action === 'softDrop') {
    if (!moveCurrentPiece(0, 1) && currentPiece) {
      lockPiece(currentPiece);
      spawnNextPiece();
      render();
    } else {
      addScore(1);
    }
  } else if (action === 'hardDrop') {
    hardDropCurrentPiece();
  } else if (action === 'rotateClockwise') {
    rotateCurrentPiece(true);
  } else if (action === 'rotateCounterclockwise') {
    rotateCurrentPiece(false);
  } else if (action === 'hold') {
    holdCurrentPiece();
  } else if (action === 'pause') {
    if (currentScreen === 'game') {
      currentScreen = 'pause';
      render();
    } else if (currentScreen === 'pause') {
      setScreen('game');
    }
  }
};

const getActiveGamepad = (): Gamepad | null => {
  const gamepads = navigator.getGamepads?.();
  if (!gamepads) {
    return null;
  }

  if (activeGamepadIndex !== null) {
    return gamepads[activeGamepadIndex] ?? null;
  }

  const gamepad = gamepads.find((candidate) => candidate !== null);
  if (!gamepad) {
    return null;
  }

  activeGamepadIndex = gamepad.index;
  activeGamepadName = gamepad.id;
  render();
  return gamepad;
};

const shouldApplyRepeatedInput = (
  key: string,
  timestamp: number,
  repeatTimes: Map<string, number>,
): boolean => {
  const lastApplied = repeatTimes.get(key) ?? 0;
  if (timestamp - lastApplied < inputRepeatMs) {
    return false;
  }

  repeatTimes.set(key, timestamp);
  return true;
};

const pollGamepadButtons = (gamepad: Gamepad, timestamp: number): void => {
  gamepadButtonMap.forEach((binding) => {
    const pressed = gamepad.buttons[binding.button]?.pressed ?? false;
    const wasPressed = pressedGamepadButtons.has(binding.button);

    if (!pressed) {
      pressedGamepadButtons.delete(binding.button);
      buttonRepeatTimes.delete(String(binding.button));
      return;
    }

    if (!binding.repeat && !wasPressed) {
      applyInputAction(binding.action);
    } else if (
      binding.repeat &&
      (!wasPressed ||
        shouldApplyRepeatedInput(String(binding.button), timestamp, buttonRepeatTimes))
    ) {
      applyInputAction(binding.action);
    }

    pressedGamepadButtons.add(binding.button);
  });
};

const pollGamepadAxes = (gamepad: Gamepad, timestamp: number): void => {
  gamepadAxisMap.forEach((binding) => {
    const value = gamepad.axes[binding.axis] ?? 0;
    const active =
      binding.direction < 0
        ? value <= -gamepadAxisThreshold
        : value >= gamepadAxisThreshold;
    const key = `${binding.axis}:${binding.direction}`;

    if (!active) {
      axisRepeatTimes.delete(key);
      return;
    }

    if (shouldApplyRepeatedInput(key, timestamp, axisRepeatTimes)) {
      applyInputAction(binding.action);
    }
  });
};

const pollGamepads = (timestamp: number): void => {
  const gamepad = getActiveGamepad();
  if (!gamepad) {
    return;
  }

  pollGamepadButtons(gamepad, timestamp);
  pollGamepadAxes(gamepad, timestamp);
};

const updateGame = (timestamp: number): void => {
  pollGamepads(timestamp);

  if (timestamp - lastDropTime >= getDropInterval()) {
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
        <dd>${getGamepadStatusText()}</dd>
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
        <span>Gamepad: ${getGamepadStatusText()}</span>
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
          <strong>${score.toString().padStart(6, '0')}</strong>
          <h2>Lines</h2>
          <strong>${lines}</strong>
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
          <strong>${level.toString().padStart(2, '0')}</strong>
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
        <div><dt>Score</dt><dd>${score.toString().padStart(6, '0')}</dd></div>
        <div><dt>Lines</dt><dd>${lines}</dd></div>
        <div><dt>Level</dt><dd>${level.toString().padStart(2, '0')}</dd></div>
        <div><dt>High Score</dt><dd>000000</dd></div>
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
        <p class="connection-state">Gamepad Status: ${getGamepadStatusText()}</p>
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

const createMiniPieceCells = (definition: PieceDefinition | null): Cell[] => {
  if (!definition) {
    return Array<Cell>(16).fill(null);
  }

  const cells = Array<Cell>(16).fill(null);
  definition.cells.forEach((cell) => {
    cells[cell.y * 4 + cell.x] = definition.color;
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
    drawGridCanvas(hold, 4, 4, createMiniPieceCells(holdPiece));
  }
  if (next) {
    drawGridCanvas(next, 4, 4, createMiniPieceCells(nextQueue[0] ?? null));
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

window.addEventListener('gamepadconnected', (event) => {
  activeGamepadIndex = event.gamepad.index;
  activeGamepadName = event.gamepad.id;
  render();
});

window.addEventListener('gamepaddisconnected', (event) => {
  if (activeGamepadIndex === event.gamepad.index) {
    activeGamepadIndex = null;
    activeGamepadName = null;
    pressedGamepadButtons.clear();
    buttonRepeatTimes.clear();
    axisRepeatTimes.clear();
    render();
  }
});

window.addEventListener('keydown', (event) => {
  const action = keyboardMap.get(event.code);
  if (!action) {
    return;
  }

  event.preventDefault();
  applyInputAction(action);
});

render();
window.requestAnimationFrame(updateGame);
