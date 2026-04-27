# Verification Checklist

## Automated Checks

```bash
make build
make test
```

`make test` runs TypeScript type checking and Vitest unit tests.

## Browser Smoke Check

1. Run `make preview`.
2. Open `http://localhost:4173/` in Chrome or Edge.
3. Start a game from the title screen.
4. Confirm the board, Hold, Next, Score, Lines, Level, and Gamepad status areas render.
5. Confirm restart returns the game to a clean board.
6. Confirm title navigation returns to the title screen.

## Keyboard Check

1. Move left and right with `Left` / `Right`.
2. Soft drop with `Down`.
3. Rotate with `Up` and `Z`.
4. Hard drop with `Space`.
5. Hold with `C` or `Shift`.
6. Pause and resume with `Esc` or `P`.

## Gamepad / Pro Controller Check

1. Pair the Nintendo Switch Pro Controller with the PC over Bluetooth.
2. Open the app in Chrome or Edge.
3. Confirm Gamepad Status changes to `Connected`.
4. Move with the D-pad or left stick.
5. Soft drop with D-pad down or left stick down.
6. Rotate with `A` / `B`.
7. Hard drop with `X` / `Y`.
8. Hold with `L` / `R`.
9. Pause with `+`.

Button numbers can vary by OS and browser. If a physical controller differs, update the mapping arrays in `src/game/input.ts`.

## GitHub Pages Check

1. Merge the target branch into `main`.
2. Confirm the GitHub Pages workflow completes successfully.
3. Open the Pages URL.
4. Confirm JS and CSS load from the `/game_tetris_like/` base path.
5. Run the browser and input checks against the deployed page.
