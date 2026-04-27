export type InputAction =
  | 'moveLeft'
  | 'moveRight'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateClockwise'
  | 'rotateCounterclockwise'
  | 'hold'
  | 'pause';

export type GamepadButtonBinding = {
  button: number;
  action: InputAction;
  repeat: boolean;
};

export type GamepadAxisBinding = {
  axis: number;
  direction: -1 | 1;
  action: InputAction;
};

export const keyboardMap = new Map<string, InputAction>([
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

export const gamepadButtonMap: GamepadButtonBinding[] = [
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

export const gamepadAxisMap: GamepadAxisBinding[] = [
  { axis: 0, direction: -1, action: 'moveLeft' },
  { axis: 0, direction: 1, action: 'moveRight' },
  { axis: 1, direction: 1, action: 'softDrop' },
];
