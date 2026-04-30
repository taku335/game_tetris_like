import { describe, expect, it } from 'vitest';
import {
  collectControllerActionStates,
  collectKeyboardActionStates,
  controllerActionMapping,
  createEmptyControllerDebugSnapshot,
  createInputTimingState,
  dedupeActions,
  defaultControllerDeadZone,
  filterControllerEdgeActions,
  keyboardMap,
  keyboardMenuMap,
  oneShotControllerActions,
  repeatableActions,
  resolveTriggeredActions,
} from './input';

describe('input mappings', () => {
  it('maps keyboard controls to every gameplay action', () => {
    expect(keyboardMap.get('ArrowLeft')).toBe('moveLeft');
    expect(keyboardMap.get('ArrowRight')).toBe('moveRight');
    expect(keyboardMap.get('ArrowDown')).toBe('softDrop');
    expect(keyboardMap.get('Space')).toBe('hardDrop');
    expect(keyboardMap.get('ArrowUp')).toBe('rotateCW');
    expect(keyboardMap.get('KeyZ')).toBe('rotateCCW');
    expect(keyboardMap.get('KeyC')).toBe('hold');
    expect(keyboardMap.get('Escape')).toBe('pause');
  });

  it('maps keyboard controls to title menu actions', () => {
    expect(keyboardMenuMap.get('ArrowUp')).toBe('menuPrevious');
    expect(keyboardMenuMap.get('ArrowDown')).toBe('menuNext');
    expect(keyboardMenuMap.get('Enter')).toBe('confirm');
    expect(keyboardMenuMap.get('Escape')).toBe('back');
  });

  it('maps controller gameplay actions through named physical inputs', () => {
    expect(controllerActionMapping.moveLeft).toEqual(['dpadLeft', 'leftStickLeft']);
    expect(controllerActionMapping.moveRight).toEqual(['dpadRight', 'leftStickRight']);
    expect(controllerActionMapping.softDrop).toEqual(['dpadDown', 'leftStickDown']);
    expect(controllerActionMapping.hardDrop).toEqual(['dpadUp', 'buttonX', 'buttonY']);
    expect(controllerActionMapping.rotateCW).toBe('buttonA');
    expect(controllerActionMapping.rotateCCW).toBe('buttonB');
    expect(controllerActionMapping.hold).toEqual(['buttonL', 'buttonR', 'buttonZL', 'buttonZR']);
    expect(controllerActionMapping.pause).toBe('buttonPlus');
  });

  it('keeps only movement and menu navigation repeatable', () => {
    expect(repeatableActions).toEqual(
      new Set(['moveLeft', 'moveRight', 'softDrop', 'menuPrevious', 'menuNext']),
    );
    const oneShotActions = [
      'hardDrop',
      'rotateCW',
      'rotateCCW',
      'hold',
      'pause',
      'confirm',
      'back',
    ] as const;

    oneShotActions.forEach((action) => {
      expect(oneShotControllerActions.has(action)).toBe(true);
    });
  });

  it('collects held controller actions for the active mode only', () => {
    const states = collectControllerActionStates(
      {
        moveLeft: true,
        moveRight: false,
        softDrop: false,
        hardDrop: true,
        rotateCW: false,
        rotateCCW: false,
        hold: false,
        pause: false,
        menuPrevious: true,
        menuNext: false,
        confirm: false,
        back: false,
      },
      'gameplay',
    );

    expect(states.map((state) => state.action)).toEqual(['moveLeft']);
    expect(states[0]?.sources.map((source) => source.id)).toEqual(['dpadLeft', 'leftStickLeft']);
  });

  it('filters controller edge actions by active mode', () => {
    expect(filterControllerEdgeActions(['pause', 'confirm', 'back'], 'gameplay')).toEqual(['pause']);
    expect(filterControllerEdgeActions(['pause', 'confirm', 'back'], 'menu')).toEqual([
      'confirm',
      'back',
    ]);
  });

  it('deduplicates repeated actions in one polling frame', () => {
    expect(dedupeActions(['moveLeft', 'moveLeft', 'moveRight'])).toEqual([
      'moveLeft',
      'moveRight',
    ]);
  });

  it('creates an empty controller snapshot when the Gamepad API is unavailable', () => {
    const snapshot = createEmptyControllerDebugSnapshot();

    expect(snapshot.connectedGamepads).toEqual([]);
    expect(snapshot.selectedGamepad).toBeNull();
    expect(snapshot.deadZone).toBe(defaultControllerDeadZone);
    expect(snapshot.actions.moveLeft).toBe(false);
    expect(snapshot.inputs.dpadLeft).toBe(false);
  });

  it('triggers held movement once, waits for repeat delay, then repeats by interval', () => {
    const timing = createInputTimingState();
    const states = [{ action: 'moveLeft' as const, pressed: true, sources: [] }];

    expect(
      resolveTriggeredActions(states, timing, 100, {
        repeatDelayMs: 260,
        repeatIntervalMs: 120,
      }),
    ).toEqual(['moveLeft']);
    expect(
      resolveTriggeredActions(states, timing, 300, {
        repeatDelayMs: 260,
        repeatIntervalMs: 120,
      }),
    ).toEqual([]);
    expect(
      resolveTriggeredActions(states, timing, 360, {
        repeatDelayMs: 260,
        repeatIntervalMs: 120,
      }),
    ).toEqual(['moveLeft']);
    expect(
      resolveTriggeredActions(states, timing, 430, {
        repeatDelayMs: 260,
        repeatIntervalMs: 120,
      }),
    ).toEqual([]);
    expect(
      resolveTriggeredActions(states, timing, 480, {
        repeatDelayMs: 260,
        repeatIntervalMs: 120,
      }),
    ).toEqual(['moveLeft']);
  });

  it('does not repeat one-shot keyboard actions while held', () => {
    const timing = createInputTimingState();
    const states = [{ action: 'hardDrop' as const, pressed: true, sources: [] }];

    expect(
      resolveTriggeredActions(states, timing, 100, {
        repeatDelayMs: 260,
        repeatIntervalMs: 120,
      }),
    ).toEqual(['hardDrop']);
    expect(
      resolveTriggeredActions(states, timing, 500, {
        repeatDelayMs: 260,
        repeatIntervalMs: 120,
      }),
    ).toEqual([]);
  });

  it('collects keyboard states by active mode', () => {
    const pressedCodes = new Set(['ArrowDown', 'Enter']);

    expect(collectKeyboardActionStates(pressedCodes, 'gameplay').map((state) => state.action)).toEqual([
      'softDrop',
    ]);
    expect(collectKeyboardActionStates(pressedCodes, 'menu').map((state) => state.action)).toEqual([
      'menuNext',
      'confirm',
    ]);
  });
});
