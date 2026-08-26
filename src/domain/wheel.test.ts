import { describe, expect, it } from 'vitest';
import {
  LABEL_LENGTH,
  PALETTE_SIZE,
  fitLabel,
  labelFontSize,
  maxLabelChars,
  segmentColorVar,
  labelRotation,
  segmentPath,
  shouldFlipLabel,
} from './wheel';

describe('segmentColorVar', () => {
  it('uses each palette colour in turn', () => {
    for (let i = 0; i < PALETTE_SIZE; i++) {
      expect(segmentColorVar(i, PALETTE_SIZE)).toBe(`var(--seg-${i + 1})`);
    }
  });

  it('never lets the last segment match the first, which would merge them visually', () => {
    for (let count = 2; count <= 24; count++) {
      const first = segmentColorVar(0, count);
      const last = segmentColorVar(count - 1, count);
      expect(last).not.toBe(first);
    }
  });
});

describe('labelFontSize', () => {
  it('shrinks as the pool grows', () => {
    const small = labelFontSize(4, 7);
    const large = labelFontSize(20, 7);
    expect(large).toBeLessThan(small);
  });

  it('shrinks for longer names', () => {
    expect(labelFontSize(8, 20)).toBeLessThan(labelFontSize(8, 6));
  });

  it('never goes below the readable floor or above the cap', () => {
    for (let count = 1; count <= 30; count++) {
      for (const len of [1, 7, 28, 100]) {
        const size = labelFontSize(count, len);
        expect(size).toBeGreaterThanOrEqual(3);
        expect(size).toBeLessThanOrEqual(7.5);
      }
    }
  });
});

describe('fitLabel', () => {
  it('leaves a name that fits completely alone', () => {
    expect(fitLabel('Sarah M', 12)).toBe('Sarah M');
  });

  it('truncates with an ellipsis when it cannot fit', () => {
    const out = fitLabel('Bartholomew Fitz', 8);
    expect(out).toHaveLength(8);
    expect(out.endsWith('…')).toBe(true);
  });

  it('keeps typical dance names intact at a full 20-dancer pool', () => {
    const names = ['Sarah M', 'Marco R', 'Zoe K', 'Priya N', 'Alex W', 'Jamie T'];
    const font = labelFontSize(20, Math.max(...names.map((n) => n.length)));
    const max = maxLabelChars(font);
    for (const name of names) {
      expect(fitLabel(name, max)).toBe(name);
    }
  });
});

describe('maxLabelChars', () => {
  it('allows more characters as the font shrinks', () => {
    expect(maxLabelChars(3)).toBeGreaterThan(maxLabelChars(7.5));
  });

  it('always leaves room for at least a few characters', () => {
    expect(maxLabelChars(100)).toBeGreaterThanOrEqual(3);
  });

  it('is consistent with the label length it derives from', () => {
    expect(maxLabelChars(3)).toBeLessThanOrEqual(LABEL_LENGTH);
  });
});

describe('segmentPath', () => {
  it('draws a closed path for every pool size', () => {
    for (let count = 1; count <= 20; count++) {
      for (let i = 0; i < count; i++) {
        const d = segmentPath(i, count);
        expect(d.startsWith('M')).toBe(true);
        expect(d.trimEnd().endsWith('Z')).toBe(true);
        expect(d).not.toContain('NaN');
      }
    }
  });

  it('uses the large-arc flag once a segment passes a half turn', () => {
    expect(segmentPath(0, 2)).toContain(' 0 1 ');
    expect(segmentPath(0, 8)).toContain(' 0 0 1 ');
  });
});

describe('shouldFlipLabel', () => {
  it('leaves right-hand labels alone and flips left-hand ones', () => {
    // Four segments at rest: centres at 45, 135, 225, 315 degrees.
    expect(shouldFlipLabel(0, 4, 0)).toBe(false); // top-right
    expect(shouldFlipLabel(1, 4, 0)).toBe(false); // bottom-right
    expect(shouldFlipLabel(2, 4, 0)).toBe(true); // bottom-left
    expect(shouldFlipLabel(3, 4, 0)).toBe(true); // top-left
  });

  it('follows the segment as the wheel turns', () => {
    // Half a turn swaps which side every segment sits on.
    for (let i = 0; i < 4; i++) {
      expect(shouldFlipLabel(i, 4, 180)).toBe(!shouldFlipLabel(i, 4, 0));
    }
  });

  it('is unaffected by whole revolutions', () => {
    for (let i = 0; i < 6; i++) {
      expect(shouldFlipLabel(i, 6, 720)).toBe(shouldFlipLabel(i, 6, 0));
      expect(shouldFlipLabel(i, 6, -360)).toBe(shouldFlipLabel(i, 6, 0));
    }
  });

  it('never leaves a label pointing into the left half', () => {
    for (const rotation of [0, 37, 190, 355, 1234]) {
      for (let i = 0; i < 8; i++) {
        const flipped = shouldFlipLabel(i, 8, rotation);
        const angle = labelRotation(i, 8) + rotation + (flipped ? 180 : 0);
        const screen = (((angle % 360) + 360) % 360);
        expect(screen <= 90 || screen >= 270).toBe(true);
      }
    }
  });
});

describe('per-label sizing and the legibility floor', () => {
  it('sizes each name independently, so one long name does not shrink the rest', () => {
    const short = labelFontSize(10, 'Sam O'.length);
    const long = labelFontSize(10, 'Alex Wintergreen'.length);
    expect(short).toBeGreaterThan(long);
  });

  it('never renders a label below the legibility floor', () => {
    for (let count = 1; count <= 20; count++) {
      for (const len of [5, 16, 28, 60]) {
        expect(labelFontSize(count, len)).toBeGreaterThanOrEqual(4.2);
      }
    }
  });

  it('truncates a name that cannot fit at the floor rather than shrinking it', () => {
    const font = labelFontSize(10, 40);
    const label = fitLabel('A'.repeat(40), maxLabelChars(font));
    expect(font).toBe(4.2);
    expect(label.endsWith('…')).toBe(true);
    expect(label.length).toBeLessThan(40);
  });
});
