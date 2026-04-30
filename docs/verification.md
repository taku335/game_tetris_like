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
7. Resize the browser height and confirm the game screen remains inside the viewport without a vertical scrollbar.

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
4. On the title screen, move the selection with the D-pad or left stick.
5. Start the game with `A` or `+`.
6. Move left and right with the D-pad and confirm one tap moves exactly one column.
7. Move left and right with the left stick and confirm it matches the D-pad behavior.
8. Hold left or right and confirm movement repeats after a short delay at a steady interval.
9. Soft drop with D-pad down or left stick down.
10. Hard drop with D-pad up / `X` / `Y`.
11. Rotate clockwise with `A` and counterclockwise with `B`.
12. Hold with `L` / `R` / `ZL` / `ZR`.
13. Pause with `+`.

## Controller Diagnostics Check

1. Open the Controls screen.
2. Confirm connection status, connected gamepad list, selected controller, and Pro Controller confidence are displayed.
3. Confirm dead zone and saved settings state are displayed.
4. Press each D-pad direction and confirm the named input state updates.
5. Move the left stick and confirm the named stick direction input updates.
6. Press `A` / `B` / `X` / `Y` / `L` / `R` / `ZL` / `ZR` / `+` and confirm input state updates.
7. Confirm mapped actions update without showing physical button numbers or axis indexes.

Gamepad API data can vary by Windows / macOS, Chrome / Edge, Bluetooth / USB, browser version, and controller firmware. The game should continue to run if no Pro Controller is connected.

## GitHub Pages Check

1. Merge the target branch into `main`.
2. Confirm the GitHub Pages workflow completes successfully.
3. Open the Pages URL.
4. Confirm JS and CSS load from the `/game_tetris_like/` base path.
5. Run the browser and input checks against the deployed page.
