export type GameplayAction =
  | 'moveLeft'
  | 'moveRight'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateClockwise'
  | 'rotateCounterclockwise'
  | 'hold'
  | 'pause';

export type MenuAction = 'menuPrevious' | 'menuNext' | 'confirm' | 'back';
export type InputAction = GameplayAction | MenuAction;
export type InputMode = 'gameplay' | 'menu';
export type InputSourceType = 'keyboard' | 'gamepadButton' | 'gamepadAxis';

export type InputSource = {
  type: InputSourceType;
  id: string;
  label: string;
};

export type ActionInputState = {
  action: InputAction;
  pressed: boolean;
  sources: InputSource[];
};

export type InputTimingState = {
  heldActions: Set<InputAction>;
  repeatTimes: Map<InputAction, number>;
  repeatedActions: Set<InputAction>;
};

export type InputRepeatOptions = {
  repeatDelayMs: number;
  repeatIntervalMs: number;
};

export type GamepadButtonBinding = {
  button: number;
  action: GameplayAction;
  repeat: boolean;
  label: string;
};

export type GamepadAxisBinding = {
  axis: number;
  direction: -1 | 1;
  action: GameplayAction;
  label: string;
};

export type MenuGamepadButtonBinding = {
  button: number;
  action: MenuAction;
  repeat: boolean;
  label: string;
};

export type MenuGamepadAxisBinding = {
  axis: number;
  direction: -1 | 1;
  action: MenuAction;
  label: string;
};

export type GamepadButtonDebugState = {
  index: number;
  label: string;
  pressed: boolean;
  value: number;
};

export type GamepadDirectionDebugState = {
  action: GameplayAction | MenuAction;
  label: string;
  pressed: boolean;
  sources: InputSource[];
};

export type GamepadDebugSnapshot = {
  connected: boolean;
  id: string | null;
  index: number | null;
  axes: number[];
  buttons: GamepadButtonDebugState[];
  directions: GamepadDirectionDebugState[];
  activeActionSources: Map<InputAction, InputSource[]>;
};

export const createInputTimingState = (): InputTimingState => ({
  heldActions: new Set<InputAction>(),
  repeatTimes: new Map<InputAction, number>(),
  repeatedActions: new Set<InputAction>(),
});

export const keyboardMap = new Map<string, GameplayAction>([
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

export const keyboardMenuMap = new Map<string, MenuAction>([
  ['ArrowUp', 'menuPrevious'],
  ['ArrowLeft', 'menuPrevious'],
  ['KeyW', 'menuPrevious'],
  ['KeyA', 'menuPrevious'],
  ['ArrowDown', 'menuNext'],
  ['ArrowRight', 'menuNext'],
  ['KeyS', 'menuNext'],
  ['KeyD', 'menuNext'],
  ['Enter', 'confirm'],
  ['Space', 'confirm'],
  ['Escape', 'back'],
]);

export const gamepadButtonMap: GamepadButtonBinding[] = [
  { button: 14, action: 'moveLeft', repeat: true, label: 'D-Pad Left' },
  { button: 15, action: 'moveRight', repeat: true, label: 'D-Pad Right' },
  { button: 13, action: 'softDrop', repeat: true, label: 'D-Pad Down' },
  { button: 0, action: 'rotateClockwise', repeat: false, label: 'A' },
  { button: 1, action: 'rotateCounterclockwise', repeat: false, label: 'B' },
  { button: 2, action: 'hardDrop', repeat: false, label: 'X' },
  { button: 3, action: 'hardDrop', repeat: false, label: 'Y' },
  { button: 4, action: 'hold', repeat: false, label: 'L' },
  { button: 5, action: 'hold', repeat: false, label: 'R' },
  { button: 9, action: 'pause', repeat: false, label: '+' },
];

export const gamepadAxisMap: GamepadAxisBinding[] = [
  { axis: 0, direction: -1, action: 'moveLeft', label: 'Left Stick Left' },
  { axis: 0, direction: 1, action: 'moveRight', label: 'Left Stick Right' },
  { axis: 1, direction: 1, action: 'softDrop', label: 'Left Stick Down' },
];

export const menuGamepadButtonMap: MenuGamepadButtonBinding[] = [
  { button: 12, action: 'menuPrevious', repeat: true, label: 'D-Pad Up' },
  { button: 14, action: 'menuPrevious', repeat: true, label: 'D-Pad Left' },
  { button: 13, action: 'menuNext', repeat: true, label: 'D-Pad Down' },
  { button: 15, action: 'menuNext', repeat: true, label: 'D-Pad Right' },
  { button: 0, action: 'confirm', repeat: false, label: 'A' },
  { button: 9, action: 'confirm', repeat: false, label: '+' },
  { button: 1, action: 'back', repeat: false, label: 'B' },
  { button: 8, action: 'back', repeat: false, label: '-' },
];

export const menuGamepadAxisMap: MenuGamepadAxisBinding[] = [
  { axis: 0, direction: -1, action: 'menuPrevious', label: 'Left Stick Left' },
  { axis: 1, direction: -1, action: 'menuPrevious', label: 'Left Stick Up' },
  { axis: 0, direction: 1, action: 'menuNext', label: 'Left Stick Right' },
  { axis: 1, direction: 1, action: 'menuNext', label: 'Left Stick Down' },
];

export const repeatableActions = new Set<InputAction>([
  'moveLeft',
  'moveRight',
  'softDrop',
  'menuPrevious',
  'menuNext',
]);

const trackedButtonLabels = new Map<number, string>([
  [0, 'A'],
  [1, 'B'],
  [2, 'X'],
  [3, 'Y'],
  [4, 'L'],
  [5, 'R'],
  [8, '-'],
  [9, '+'],
  [12, 'D-Pad Up'],
  [13, 'D-Pad Down'],
  [14, 'D-Pad Left'],
  [15, 'D-Pad Right'],
]);

const directionLabels = new Map<InputAction, string>([
  ['moveLeft', 'Left'],
  ['moveRight', 'Right'],
  ['softDrop', 'Down'],
  ['menuPrevious', 'Previous'],
  ['menuNext', 'Next'],
  ['confirm', 'Confirm'],
  ['back', 'Back'],
]);

export const createEmptyGamepadSnapshot = (): GamepadDebugSnapshot => ({
  connected: false,
  id: null,
  index: null,
  axes: [0, 0],
  buttons: Array.from(trackedButtonLabels, ([index, label]) => ({
    index,
    label,
    pressed: false,
    value: 0,
  })),
  directions: [],
  activeActionSources: new Map<InputAction, InputSource[]>(),
});

const addActionSource = (
  actionSources: Map<InputAction, InputSource[]>,
  action: InputAction,
  source: InputSource,
): void => {
  const sources = actionSources.get(action) ?? [];
  sources.push(source);
  actionSources.set(action, sources);
};

const isAxisActive = (value: number, direction: -1 | 1, threshold: number): boolean =>
  direction < 0 ? value <= -threshold : value >= threshold;

export const collectKeyboardActionStates = (
  pressedCodes: Set<string>,
  mode: InputMode,
): ActionInputState[] => {
  const actionSources = new Map<InputAction, InputSource[]>();
  const mapping = mode === 'gameplay' ? keyboardMap : keyboardMenuMap;

  pressedCodes.forEach((code) => {
    const action = mapping.get(code);
    if (!action) {
      return;
    }

    addActionSource(actionSources, action, {
      type: 'keyboard',
      id: code,
      label: code,
    });
  });

  return Array.from(actionSources, ([action, sources]) => ({
    action,
    pressed: true,
    sources,
  }));
};

export const collectGamepadActionStates = (
  gamepad: Pick<Gamepad, 'axes' | 'buttons' | 'id' | 'index'> | null,
  mode: InputMode,
  axisThreshold: number,
): { states: ActionInputState[]; snapshot: GamepadDebugSnapshot } => {
  if (!gamepad) {
    return { states: [], snapshot: createEmptyGamepadSnapshot() };
  }

  const actionSources = new Map<InputAction, InputSource[]>();
  const buttonBindings = mode === 'gameplay' ? gamepadButtonMap : menuGamepadButtonMap;
  const axisBindings = mode === 'gameplay' ? gamepadAxisMap : menuGamepadAxisMap;

  buttonBindings.forEach((binding) => {
    const button = gamepad.buttons[binding.button];
    if (!button?.pressed) {
      return;
    }

    addActionSource(actionSources, binding.action, {
      type: 'gamepadButton',
      id: String(binding.button),
      label: binding.label,
    });
  });

  axisBindings.forEach((binding) => {
    const value = gamepad.axes[binding.axis] ?? 0;
    if (!isAxisActive(value, binding.direction, axisThreshold)) {
      return;
    }

    addActionSource(actionSources, binding.action, {
      type: 'gamepadAxis',
      id: `${binding.axis}:${binding.direction}`,
      label: binding.label,
    });
  });

  const buttons = Array.from(trackedButtonLabels, ([index, label]) => {
    const button = gamepad.buttons[index];
    return {
      index,
      label,
      pressed: button?.pressed ?? false,
      value: button?.value ?? 0,
    };
  });
  const directions = Array.from(actionSources, ([action, sources]) => ({
    action,
    label: directionLabels.get(action) ?? action,
    pressed: true,
    sources,
  }));

  return {
    states: Array.from(actionSources, ([action, sources]) => ({
      action,
      pressed: true,
      sources,
    })),
    snapshot: {
      connected: true,
      id: gamepad.id,
      index: gamepad.index,
      axes: Array.from(gamepad.axes).slice(0, 4),
      buttons,
      directions,
      activeActionSources: actionSources,
    },
  };
};

export const resolveTriggeredActions = (
  states: ActionInputState[],
  timingState: InputTimingState,
  timestamp: number,
  options: InputRepeatOptions,
): InputAction[] => {
  const activeActions = new Set(states.filter((state) => state.pressed).map((state) => state.action));
  const triggered: InputAction[] = [];

  activeActions.forEach((action) => {
    const wasHeld = timingState.heldActions.has(action);
    const repeatable = repeatableActions.has(action);
    const lastRepeated = timingState.repeatTimes.get(action);
    const repeatElapsed = lastRepeated === undefined ? 0 : timestamp - lastRepeated;

    if (!wasHeld) {
      triggered.push(action);
      timingState.repeatTimes.set(action, timestamp);
      return;
    }

    const repeatMs = timingState.repeatedActions.has(action)
      ? options.repeatIntervalMs
      : options.repeatDelayMs;

    if (repeatable && repeatElapsed >= repeatMs) {
      triggered.push(action);
      timingState.repeatTimes.set(action, timestamp);
      timingState.repeatedActions.add(action);
    }
  });

  timingState.heldActions.forEach((action) => {
    if (!activeActions.has(action)) {
      timingState.repeatTimes.delete(action);
      timingState.repeatedActions.delete(action);
    }
  });

  timingState.heldActions = activeActions;
  return triggered;
};

export const shouldApplyGamepadAction = (
  appliedActions: Set<InputAction>,
  action: InputAction,
): boolean => {
  if (appliedActions.has(action)) {
    return false;
  }

  appliedActions.add(action);
  return true;
};
