import './styles/app.css';

type Screen = 'title' | 'game' | 'pause' | 'gameOver' | 'controls';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element was not found.');
}

const root = app;

let currentScreen: Screen = 'title';
let previousScreen: Screen = 'title';

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

const renderBoardCells = (): string =>
  Array.from({ length: 200 }, (_, index) => {
    const sample = [4, 14, 24, 25, 156, 166, 176, 177, 188, 189].includes(index)
      ? ' is-filled'
      : '';
    return `<span class="board-cell${sample}" aria-hidden="true"></span>`;
  }).join('');

const renderMiniCells = (filled: number[]): string =>
  Array.from({ length: 16 }, (_, index) => {
    const sample = filled.includes(index) ? ' is-filled' : '';
    return `<span class="mini-cell${sample}" aria-hidden="true"></span>`;
  }).join('');

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
          <div class="mini-board" aria-label="Hold block preview">
            ${renderMiniCells([1, 5, 9, 13])}
          </div>
        </section>
        <section class="panel stats-panel">
          <h2>Score</h2>
          <strong>012340</strong>
          <h2>Lines</h2>
          <strong>18</strong>
        </section>
      </aside>

      <section class="board-wrap" aria-label="Main board">
        <div class="board-grid">${renderBoardCells()}</div>
      </section>

      <aside class="side-panel">
        <section class="panel">
          <h2>Next</h2>
          <div class="mini-board" aria-label="Next block preview">
            ${renderMiniCells([4, 5, 6, 9])}
          </div>
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
}

root.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const action = target.dataset.action;

  if (action === 'start' || action === 'restart') {
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
