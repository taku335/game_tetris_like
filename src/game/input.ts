import { createProconMapper } from 'procon-gamepad-mapper';
import type {
  ActionMapping,
  ActionState,
  DetectedGamepad,
  PhysicalInputState,
  ProconMapper,
  ProconPhysicalInput,
} from 'procon-gamepad-mapper';

export type GameplayAction =
  | 'moveLeft'
  | 'moveRight'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateCW'
  | 'rotateCCW'
  | 'hold'
  | 'pause';

export type MenuAction = 'menuPrevious' | 'menuNext' | 'confirm' | 'back';
export type InputAction = GameplayAction | MenuAction;
export type InputMode = 'gameplay' | 'menu';
export type InputSourceType = 'keyboard' | 'controller';
export type SavedControllerConfigState = 'loaded' | 'default';

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

export type ControllerInput = {
  mapper: ProconMapper<InputAction>;
  savedConfigState: SavedControllerConfigState;
};

export type ControllerDebugSnapshot = {
  supported: boolean;
  connectedGamepads: DetectedGamepad[];
  selectedGamepad: DetectedGamepad | null;
  inputs: PhysicalInputState;
  actions: ActionState<InputAction>;
  deadZone: number;
  savedConfigState: SavedControllerConfigState;
};

export const controllerStorageKey = 'game_tetris_like:procon:v1';
export const defaultControllerDeadZone = 0.55;

export const controllerActionMapping: ActionMapping<InputAction> = {
  moveLeft: ['dpadLeft', 'leftStickLeft'],
  moveRight: ['dpadRight', 'leftStickRight'],
  softDrop: ['dpadDown', 'leftStickDown'],
  hardDrop: ['dpadUp', 'buttonX', 'buttonY'],
  rotateCW: 'buttonA',
  rotateCCW: 'buttonB',
  hold: ['buttonL', 'buttonR', 'buttonZL', 'buttonZR'],
  pause: 'buttonPlus',
  menuPrevious: ['dpadUp', 'dpadLeft', 'leftStickUp', 'leftStickLeft'],
  menuNext: ['dpadDown', 'dpadRight', 'leftStickDown', 'leftStickRight'],
  confirm: ['buttonA', 'buttonPlus'],
  back: ['buttonB', 'buttonMinus'],
};

export const controllerPhysicalInputs: ProconPhysicalInput[] = [
  'buttonA',
  'buttonB',
  'buttonX',
  'buttonY',
  'buttonL',
  'buttonR',
  'buttonZL',
  'buttonZR',
  'buttonMinus',
  'buttonPlus',
  'dpadUp',
  'dpadDown',
  'dpadLeft',
  'dpadRight',
  'leftStickUp',
  'leftStickDown',
  'leftStickLeft',
  'leftStickRight',
];

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
  ['ArrowUp', 'rotateCW'],
  ['KeyW', 'rotateCW'],
  ['KeyX', 'rotateCW'],
  ['KeyZ', 'rotateCCW'],
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

export const repeatableActions = new Set<InputAction>([
  'moveLeft',
  'moveRight',
  'softDrop',
  'menuPrevious',
  'menuNext',
]);

export const gameplayActions = new Set<InputAction>([
  'moveLeft',
  'moveRight',
  'softDrop',
  'hardDrop',
  'rotateCW',
  'rotateCCW',
  'hold',
  'pause',
]);

export const menuActions = new Set<InputAction>([
  'menuPrevious',
  'menuNext',
  'confirm',
  'back',
]);

export const oneShotControllerActions = new Set<InputAction>([
  'hardDrop',
  'rotateCW',
  'rotateCCW',
  'hold',
  'pause',
  'confirm',
  'back',
]);

export const physicalInputLabels: Record<ProconPhysicalInput, string> = {
  buttonA: 'A',
  buttonB: 'B',
  buttonX: 'X',
  buttonY: 'Y',
  buttonL: 'L',
  buttonR: 'R',
  buttonZL: 'ZL',
  buttonZR: 'ZR',
  buttonMinus: '-',
  buttonPlus: '+',
  buttonHome: 'Home',
  buttonCapture: 'Capture',
  buttonLeftStick: 'Left Stick Button',
  buttonRightStick: 'Right Stick Button',
  dpadUp: 'D-Pad Up',
  dpadDown: 'D-Pad Down',
  dpadLeft: 'D-Pad Left',
  dpadRight: 'D-Pad Right',
  leftStickUp: 'Left Stick Up',
  leftStickDown: 'Left Stick Down',
  leftStickLeft: 'Left Stick Left',
  leftStickRight: 'Left Stick Right',
  rightStickUp: 'Right Stick Up',
  rightStickDown: 'Right Stick Down',
  rightStickLeft: 'Right Stick Left',
  rightStickRight: 'Right Stick Right',
};

export const createControllerInput = (): ControllerInput => {
  const mapper = createProconMapper<InputAction>({
    mapping: controllerActionMapping,
    deadZone: defaultControllerDeadZone,
    storageKey: controllerStorageKey,
  });

  const savedConfigState = mapper.load() ? 'loaded' : 'default';
  return { mapper, savedConfigState };
};

export const createEmptyControllerDebugSnapshot = (
  savedConfigState: SavedControllerConfigState = 'default',
): ControllerDebugSnapshot => ({
  supported: typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function',
  connectedGamepads: [],
  selectedGamepad: null,
  inputs: Object.fromEntries(
    controllerPhysicalInputs.map((input) => [input, false]),
  ) as PhysicalInputState,
  actions: Object.fromEntries(
    (Object.keys(controllerActionMapping) as InputAction[]).map((action) => [action, false]),
  ) as ActionState<InputAction>,
  deadZone: defaultControllerDeadZone,
  savedConfigState,
});

export const createControllerDebugSnapshot = (
  controller: ControllerInput,
  actions: ActionState<InputAction>,
): ControllerDebugSnapshot => ({
  supported: typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function',
  connectedGamepads: controller.mapper.getConnectedGamepads(),
  selectedGamepad: controller.mapper.getSelectedGamepad(),
  inputs: controller.mapper.getInputState(),
  actions,
  deadZone: controller.mapper.getDeadZone(),
  savedConfigState: controller.savedConfigState,
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

export const getActionMode = (action: InputAction): InputMode =>
  gameplayActions.has(action) ? 'gameplay' : 'menu';

const actionMatchesMode = (action: InputAction, mode: InputMode): boolean =>
  getActionMode(action) === mode;

export const getControllerActionInputs = (action: InputAction): ProconPhysicalInput[] => {
  const inputs = controllerActionMapping[action];
  return Array.isArray(inputs) ? inputs : [inputs];
};

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

export const collectControllerActionStates = (
  actions: ActionState<InputAction>,
  mode: InputMode,
): ActionInputState[] =>
  (Object.keys(controllerActionMapping) as InputAction[])
    .filter((action) => actionMatchesMode(action, mode))
    .filter((action) => actions[action] && !oneShotControllerActions.has(action))
    .map((action) => ({
      action,
      pressed: true,
      sources: getControllerActionInputs(action).map((input) => ({
        type: 'controller',
        id: input,
        label: physicalInputLabels[input],
      })),
    }));

export const filterControllerEdgeActions = (
  actions: InputAction[],
  mode: InputMode,
): InputAction[] => actions.filter((action) => actionMatchesMode(action, mode));

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

export const dedupeActions = (actions: InputAction[]): InputAction[] => Array.from(new Set(actions));
