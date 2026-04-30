import './styles/app.css';
import {
  collectControllerActionStates,
  collectKeyboardActionStates,
  createControllerDebugSnapshot,
  createControllerInput,
  createEmptyControllerDebugSnapshot,
  createInputTimingState,
  dedupeActions,
  filterControllerEdgeActions,
  getControllerActionInputs,
  keyboardMap,
  keyboardMenuMap,
  physicalInputLabels,
  controllerPhysicalInputs,
  resolveTriggeredActions,
} from './game/input';
import type { ControllerDebugSnapshot, GameplayAction, InputAction, InputMode } from './game/input';
import {
  calculateDropInterval,
  calculateLevel,
  calculateLineClearScore,
  clearCompletedRows,
} from './game/rules';
import type { Cell } from './game/rules';

type Screen = 'title' | 'game' | 'pause' | 'gameOver' | 'controls';
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

const boardColumns = 10;
const boardRows = 20;
const baseDropIntervalMs = 650;
const minDropIntervalMs = 120;
const inputRepeatDelayMs = 260;
const inputRepeatIntervalMs = 120;
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
const pressedKeyboardCodes = new Set<string>();
const inputTimingState = createInputTimingState();
const controllerInput = createControllerInput();
const controllerEdgeActions: InputAction[] = [];
let selectedTitleMenuIndex = 0;
let latestControllerSnapshot: ControllerDebugSnapshot = createEmptyControllerDebugSnapshot(
  controllerInput.savedConfigState,
);
let suppressInputUntilNeutral = false;
let lastControlsRenderTime = 0;
const highScoreStorageKey = 'falling-blocks:high-score';
const titleMenuActions = ['start', 'controls'] as const;

const loadHighScore = (): number => {
  try {
    const storedScore = window.localStorage.getItem(highScoreStorageKey);
    const parsedScore = storedScore ? Number.parseInt(storedScore, 10) : 0;
    return Number.isFinite(parsedScore) && parsedScore > 0 ? parsedScore : 0;
  } catch {
    return 0;
  }
};

const saveHighScore = (value: number): void => {
  try {
    window.localStorage.setItem(highScoreStorageKey, String(value));
  } catch {
    // Storage can be unavailable in private browsing or restricted embeds.
  }
};

let highScore = loadHighScore();

const formatScore = (value: number): string => value.toString().padStart(6, '0');

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const resetInputTiming = (): void => {
  inputTimingState.heldActions.clear();
  inputTimingState.repeatTimes.clear();
  inputTimingState.repeatedActions.clear();
  suppressInputUntilNeutral = true;
};

const setScreen = (screen: Screen): void => {
  if (screen !== 'pause' && screen !== 'controls') {
    previousScreen = screen;
  }
  currentScreen = screen;
  resetInputTiming();
  render();
};

const openControls = (): void => {
  previousScreen = currentScreen;
  currentScreen = 'controls';
  resetInputTiming();
  render();
};

const startGame = (): void => {
  resetGame();
  setScreen('game');
};

const pauseGame = (): void => {
  if (currentScreen !== 'game') {
    return;
  }

  currentScreen = 'pause';
  resetInputTiming();
  render();
};

const resumeGame = (): void => {
  if (currentScreen !== 'pause') {
    return;
  }

  lastDropTime = performance.now();
  setScreen('game');
};

const finishGame = (): void => {
  if (score > highScore) {
    highScore = score;
    saveHighScore(highScore);
  }

  currentPiece = null;
  currentScreen = 'gameOver';
  resetInputTiming();
  render();
};

const returnToTitle = (): void => {
  currentScreen = 'title';
  previousScreen = 'title';
  selectedTitleMenuIndex = 0;
  resetInputTiming();
  render();
};

const getGamepadStatusText = (): string => {
  if (!latestControllerSnapshot.supported) {
    return 'Gamepad API unavailable';
  }
  if (latestControllerSnapshot.selectedGamepad) {
    return `Connected: ${latestControllerSnapshot.selectedGamepad.id}`;
  }
  if (latestControllerSnapshot.connectedGamepads.length > 0) {
    return 'Connected';
  }
  return 'Waiting for controller';
};

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
  calculateDropInterval(level, baseDropIntervalMs, minDropIntervalMs);

const addScore = (points: number): void => {
  score += points * level;
};

const clearCompletedLines = (): void => {
  const result = clearCompletedRows(boardCells, boardColumns, boardRows);
  const { cleared } = result;

  if (cleared === 0) {
    return;
  }

  boardCells = result.cells;
  lines += cleared;
  level = calculateLevel(lines);
  score += calculateLineClearScore(cleared, level);
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
    finishGame();
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
      finishGame();
      return;
    }
  } else {
    currentPiece = takeNextPiece();
    if (collides(currentPiece)) {
      finishGame();
      return;
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

const applyGameplayAction = (action: GameplayAction): void => {
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
  } else if (action === 'rotateCW') {
    rotateCurrentPiece(true);
  } else if (action === 'rotateCCW') {
    rotateCurrentPiece(false);
  } else if (action === 'hold') {
    holdCurrentPiece();
  } else if (action === 'pause') {
    if (currentScreen === 'game') {
      pauseGame();
    } else if (currentScreen === 'pause') {
      resumeGame();
    }
  }
};

const getInputMode = (): InputMode =>
  currentScreen === 'title' || currentScreen === 'controls' ? 'menu' : 'gameplay';

const activateTitleSelection = (): void => {
  const action = titleMenuActions[selectedTitleMenuIndex];
  if (action === 'start') {
    startGame();
  } else {
    openControls();
  }
};

const applyMenuAction = (action: InputAction): void => {
  if (currentScreen === 'title') {
    if (action === 'menuPrevious' || action === 'menuNext') {
      const direction = action === 'menuPrevious' ? -1 : 1;
      selectedTitleMenuIndex =
        (selectedTitleMenuIndex + direction + titleMenuActions.length) % titleMenuActions.length;
      render();
    } else if (action === 'confirm') {
      activateTitleSelection();
    }
    return;
  }

  if (currentScreen === 'controls' && (action === 'back' || action === 'confirm')) {
    setScreen(previousScreen === 'controls' ? 'title' : previousScreen);
  }
};

const applyTriggeredAction = (action: InputAction): void => {
  if (
    action === 'menuPrevious' ||
    action === 'menuNext' ||
    action === 'confirm' ||
    action === 'back'
  ) {
    applyMenuAction(action);
  } else {
    applyGameplayAction(action);
  }
};

const pollInputs = (timestamp: number): void => {
  const mode = getInputMode();
  const keyboardStates = collectKeyboardActionStates(pressedKeyboardCodes, mode);
  const controllerActions = controllerInput.mapper.getPressedActions();
  latestControllerSnapshot = createControllerDebugSnapshot(controllerInput, controllerActions);
  const controllerStates = collectControllerActionStates(controllerActions, mode);
  const inputStates = [...keyboardStates, ...controllerStates];
  const hasActiveControllerAction = Object.values(controllerActions).some(Boolean);
  if (suppressInputUntilNeutral) {
    if (!inputStates.some((state) => state.pressed) && !hasActiveControllerAction) {
      suppressInputUntilNeutral = false;
    }
    inputTimingState.heldActions.clear();
    inputTimingState.repeatTimes.clear();
    inputTimingState.repeatedActions.clear();
    return;
  }

  const heldActions = resolveTriggeredActions(inputStates, inputTimingState, timestamp, {
    repeatDelayMs: inputRepeatDelayMs,
    repeatIntervalMs: inputRepeatIntervalMs,
  });
  const edgeActions = filterControllerEdgeActions(controllerEdgeActions.splice(0), mode);
  const actions = dedupeActions([...heldActions, ...edgeActions]);
  actions.forEach(applyTriggeredAction);
};

const updateGame = (timestamp: number): void => {
  pollInputs(timestamp);

  if (currentScreen === 'controls' && timestamp - lastControlsRenderTime >= 33) {
    lastControlsRenderTime = timestamp;
    render();
  }

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
      <button type="button" data-action="start" data-selected="${selectedTitleMenuIndex === 0}">Start Game</button>
      <button type="button" data-action="controls" data-selected="${selectedTitleMenuIndex === 1}">Controls</button>
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
        <dd>${formatScore(highScore)}</dd>
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
          <strong>${formatScore(score)}</strong>
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
        <div><dt>Score</dt><dd>${formatScore(score)}</dd></div>
        <div><dt>Lines</dt><dd>${lines}</dd></div>
        <div><dt>Level</dt><dd>${level.toString().padStart(2, '0')}</dd></div>
        <div><dt>High Score</dt><dd>${formatScore(highScore)}</dd></div>
      </dl>
      <div class="modal-actions">
        <button type="button" data-action="restart">Restart</button>
        <button type="button" data-action="title">Title</button>
      </div>
    </div>
  </section>
`;

const renderSourceList = (sources: { label: string; type: string }[]): string =>
  sources.length === 0
    ? '<span class="muted">Idle</span>'
    : sources
        .map((source) => `<span class="source-pill">${escapeHtml(source.label)}</span>`)
        .join('');

const renderGamepadDiagnostics = (): string => {
  const snapshot = latestControllerSnapshot;
  const activeInputs = controllerPhysicalInputs.filter((input) => snapshot.inputs[input]);
  const actionsToShow: InputAction[] =
    currentScreen === 'controls'
      ? ['menuPrevious', 'menuNext', 'confirm', 'back']
      : ['moveLeft', 'moveRight', 'softDrop', 'hardDrop', 'rotateCW', 'rotateCCW', 'hold', 'pause'];
  const connectedGamepads = snapshot.connectedGamepads;

  return `
    <section class="controller-debug" aria-label="Controller input monitor">
      <div class="debug-status">
        <div>
          <dt>Status</dt>
          <dd>${getGamepadStatusText()}</dd>
        </div>
        <div>
          <dt>Selected Controller</dt>
          <dd>${snapshot.selectedGamepad ? escapeHtml(snapshot.selectedGamepad.id) : 'None'}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>${snapshot.selectedGamepad ? snapshot.selectedGamepad.confidence : '-'}</dd>
        </div>
        <div>
          <dt>Dead Zone</dt>
          <dd>${snapshot.deadZone.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Saved Settings</dt>
          <dd>${snapshot.savedConfigState === 'loaded' ? 'Loaded' : 'Default'}</dd>
        </div>
      </div>

      <div class="debug-grid">
        <section class="debug-block">
          <h3>Connected Gamepads</h3>
          <div class="button-monitor">
            ${
              connectedGamepads.length > 0
                ? connectedGamepads
                    .map(
                      (gamepad) => `<span class="${gamepad.index === snapshot.selectedGamepad?.index ? 'is-active' : ''}">
                        ${escapeHtml(gamepad.id)}
                      </span>`,
                    )
                    .join('')
                : '<span class="muted">None</span>'
            }
          </div>
        </section>

        <section class="debug-block">
          <h3>Mapped Actions</h3>
          <div class="direction-pad">
            ${actionsToShow
              .map((action) => {
                const sources = getControllerActionInputs(action).map((input) => ({
                  type: 'controller',
                  label: physicalInputLabels[input],
                }));
                const pressed = snapshot.actions[action];
                const sourceClass = sources.length > 1 ? ' multi-source' : '';
                return `<div class="direction-cell${pressed ? ' is-active' : ''}${sourceClass}">
                  <span>${action}</span>
                  <small>${renderSourceList(sources)}</small>
                </div>`;
              })
              .join('')}
          </div>
        </section>

        <section class="debug-block">
          <h3>Input State</h3>
          <div class="button-monitor">
            ${controllerPhysicalInputs
              .map((input) => {
                const pressed = snapshot.inputs[input];
                return `<span class="${pressed ? 'is-active' : ''}">
                  ${escapeHtml(physicalInputLabels[input])}
                </span>`;
              })
              .join('')}
          </div>
          <p class="connection-state">Pressed: ${
            activeInputs.length > 0
              ? activeInputs.map((input) => escapeHtml(physicalInputLabels[input])).join(', ')
              : 'None'
          }</p>
        </section>
      </div>
    </section>
  `;
};

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
          <div><dt>A / B</dt><dd>Rotate CW / CCW</dd></div>
          <div><dt>D-Pad Up / X / Y</dt><dd>Hard Drop</dd></div>
          <div><dt>L / R / ZL / ZR</dt><dd>Hold</dd></div>
          <div><dt>+</dt><dd>Pause</dd></div>
        </dl>
        <p class="connection-state">Gamepad Status: ${getGamepadStatusText()}</p>
        <p class="connection-state">Controller input is mapped through procon-gamepad-mapper.</p>
        ${renderGamepadDiagnostics()}
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
    startGame();
  } else if (action === 'controls') {
    openControls();
  } else if (action === 'pause') {
    pauseGame();
  } else if (action === 'resume') {
    resumeGame();
  } else if (action === 'game-over') {
    finishGame();
  } else if (action === 'title') {
    returnToTitle();
  } else if (action === 'back') {
    setScreen(previousScreen === 'controls' ? 'title' : previousScreen);
  }
});

controllerInput.mapper.on('actiondown', (event) => {
  controllerEdgeActions.push(event.action);
});

window.addEventListener('gamepadconnected', () => {
  latestControllerSnapshot = createControllerDebugSnapshot(
    controllerInput,
    controllerInput.mapper.getPressedActions(),
  );
  render();
});

window.addEventListener('gamepaddisconnected', () => {
  latestControllerSnapshot = createControllerDebugSnapshot(
    controllerInput,
    controllerInput.mapper.getPressedActions(),
  );
  resetInputTiming();
  render();
});

window.addEventListener('keydown', (event) => {
  if (!keyboardMap.has(event.code) && !keyboardMenuMap.has(event.code)) {
    return;
  }

  event.preventDefault();
  pressedKeyboardCodes.add(event.code);
});

window.addEventListener('keyup', (event) => {
  pressedKeyboardCodes.delete(event.code);
});

render();
window.requestAnimationFrame(updateGame);
