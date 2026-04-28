import { describe, expect, it } from 'vitest';
import {
  collectGamepadActionStates,
  collectKeyboardActionStates,
  createInputTimingState,
  gamepadAxisMap,
  gamepadButtonMap,
  keyboardMap,
  keyboardMenuMap,
  resolveTriggeredActions,
  shouldApplyGamepadAction,
} from './input';
import type { InputAction } from './input';

const createButton = (pressed = false, value = pressed ? 1 : 0): GamepadButton => ({
  pressed,
  touched: pressed,
  value,
});

const createGamepad = (
  axes: number[],
  pressedButtons: number[],
): Pick<Gamepad, 'axes' | 'buttons' | 'id' | 'index'> => ({
  axes,
  buttons: Array.from({ length: 16 }, (_, index) => createButton(pressedButtons.includes(index))),
  id: 'Test Controller',
  index: 0,
});

describe('input mappings', () => {
  it('maps keyboard controls to every gameplay action', () => {
    expect(keyboardMap.get('ArrowLeft')).toBe('moveLeft');
    expect(keyboardMap.get('ArrowRight')).toBe('moveRight');
    expect(keyboardMap.get('ArrowDown')).toBe('softDrop');
    expect(keyboardMap.get('Space')).toBe('hardDrop');
    expect(keyboardMap.get('ArrowUp')).toBe('rotateClockwise');
    expect(keyboardMap.get('KeyZ')).toBe('rotateCounterclockwise');
    expect(keyboardMap.get('KeyC')).toBe('hold');
    expect(keyboardMap.get('Escape')).toBe('pause');
  });

  it('maps keyboard controls to title menu actions', () => {
    expect(keyboardMenuMap.get('ArrowUp')).toBe('menuPrevious');
    expect(keyboardMenuMap.get('ArrowDown')).toBe('menuNext');
    expect(keyboardMenuMap.get('Enter')).toBe('confirm');
    expect(keyboardMenuMap.get('Escape')).toBe('back');
  });

  it('marks movement and soft drop gamepad buttons as repeatable', () => {
    expect(gamepadButtonMap).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'moveLeft', repeat: true }),
        expect.objectContaining({ action: 'moveRight', repeat: true }),
        expect.objectContaining({ action: 'softDrop', repeat: true }),
      ]),
    );
  });

  it('keeps one-shot gamepad actions non-repeatable', () => {
    expect(gamepadButtonMap).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'hardDrop', repeat: false }),
        expect.objectContaining({ action: 'hold', repeat: false }),
        expect.objectContaining({ action: 'pause', repeat: false }),
      ]),
    );
  });

  it('maps left stick axes to movement and soft drop', () => {
    expect(gamepadAxisMap).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ axis: 0, direction: -1, action: 'moveLeft' }),
        expect.objectContaining({ axis: 0, direction: 1, action: 'moveRight' }),
        expect.objectContaining({ axis: 1, direction: 1, action: 'softDrop' }),
      ]),
    );
  });

  it('deduplicates duplicate gamepad actions in one polling frame', () => {
    const appliedActions = new Set<InputAction>();

    expect(shouldApplyGamepadAction(appliedActions, 'moveLeft')).toBe(true);
    expect(shouldApplyGamepadAction(appliedActions, 'moveLeft')).toBe(false);
    expect(shouldApplyGamepadAction(appliedActions, 'moveRight')).toBe(true);
  });

  it('collects duplicate button and axis sources as one action state', () => {
    const gamepad = createGamepad([-0.8, 0], [14]);
    const { states, snapshot } = collectGamepadActionStates(gamepad, 'gameplay', 0.55);
    const left = states.find((state) => state.action === 'moveLeft');

    expect(left?.sources).toHaveLength(2);
    expect(states.filter((state) => state.action === 'moveLeft')).toHaveLength(1);
    expect(snapshot.activeActionSources.get('moveLeft')).toHaveLength(2);
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

  it('does not repeat one-shot actions while held', () => {
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
