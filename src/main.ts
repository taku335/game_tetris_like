import './styles/app.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element was not found.');
}

app.innerHTML = `
  <main class="app-shell" aria-labelledby="app-title">
    <section class="title-screen">
      <p class="eyebrow">PC Browser Puzzle</p>
      <h1 id="app-title">Falling Blocks</h1>
      <p class="summary">
        A static web app foundation for a keyboard and Gamepad API controlled
        falling block puzzle game.
      </p>
      <div class="status-grid" aria-label="Project status">
        <div>
          <span>Build</span>
          <strong>Vite + TypeScript</strong>
        </div>
        <div>
          <span>Target</span>
          <strong>Chrome / Edge</strong>
        </div>
        <div>
          <span>Input</span>
          <strong>Keyboard + Gamepad API</strong>
        </div>
      </div>
    </section>
  </main>
`;
