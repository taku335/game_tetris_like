import { describe, expect, it } from 'vitest';
import {
  gamepadAxisMap,
  gamepadButtonMap,
  keyboardMap,
  shouldApplyGamepadAction,
} from './input';
import type { InputAction } from './input';

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
        { axis: 0, direction: -1, action: 'moveLeft' },
        { axis: 0, direction: 1, action: 'moveRight' },
        { axis: 1, direction: 1, action: 'softDrop' },
      ]),
    );
  });

  it('deduplicates duplicate gamepad actions in one polling frame', () => {
    const appliedActions = new Set<InputAction>();

    expect(shouldApplyGamepadAction(appliedActions, 'moveLeft')).toBe(true);
    expect(shouldApplyGamepadAction(appliedActions, 'moveLeft')).toBe(false);
    expect(shouldApplyGamepadAction(appliedActions, 'moveRight')).toBe(true);
  });
});
