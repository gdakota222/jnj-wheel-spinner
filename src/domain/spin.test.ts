import { describe, expect, it } from 'vitest';
import { normalizeAngle, pickIndex, planSpin, segmentUnderPointer } from './spin';

describe('normalizeAngle', () => {
  it('wraps negatives and multiples into [0, 360)', () => {
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(725)).toBe(5);
  });
});

describe('segmentUnderPointer', () => {
  it('reports the first segment when the wheel is unrotated', () => {
    expect(segmentUnderPointer(0, 4)).toBe(0);
  });

  it('walks backwards through segments as the wheel turns forward', () => {
    expect(segmentUnderPointer(90, 4)).toBe(3);
    expect(segmentUnderPointer(180, 4)).toBe(2);
  });
});

describe('planSpin', () => {
  const counts = [1, 2, 3, 5, 7, 8, 12, 20];

  it('lands on the requested segment, for every pool size', () => {
    for (const count of counts) {
      for (let index = 0; index < count; index++) {
        const { rotation } = planSpin(index, count, 0, { random: () => 0.5 });
        expect(segmentUnderPointer(rotation, count)).toBe(index);
      }
    }
  });

  it('still lands correctly at the extremes of the jitter range', () => {
    for (const count of counts) {
      for (const r of [0, 0.001, 0.25, 0.75, 0.999]) {
        for (let index = 0; index < count; index++) {
          const { rotation } = planSpin(index, count, 0, { random: () => r });
          expect(segmentUnderPointer(rotation, count)).toBe(index);
        }
      }
    }
  });

  it('lands correctly no matter where the wheel already sits', () => {
    for (const current of [0, 37, 180, 359, 1234, -95]) {
      const { rotation } = planSpin(3, 8, current, { random: () => 0.5 });
      expect(segmentUnderPointer(rotation, 8)).toBe(3);
    }
  });

  it('always turns forwards, by at least the requested number of turns', () => {
    for (const current of [0, 200, 1000]) {
      const { rotation } = planSpin(2, 6, current, { turns: 5, random: () => 0.5 });
      expect(rotation).toBeGreaterThanOrEqual(current + 5 * 360);
      expect(rotation).toBeLessThan(current + 6 * 360);
    }
  });

  it('spins a full circle even when the winner is where the wheel already stopped', () => {
    const first = planSpin(4, 8, 0, { random: () => 0.5 });
    const again = planSpin(4, 8, first.rotation, { random: () => 0.5 });
    expect(again.rotation - first.rotation).toBeGreaterThanOrEqual(5 * 360);
  });
});

describe('pickIndex', () => {
  it('covers every index and never goes out of range', () => {
    const count = 7;
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const picked = pickIndex(count);
      expect(picked).toBeGreaterThanOrEqual(0);
      expect(picked).toBeLessThan(count);
      seen.add(picked);
    }
    expect(seen.size).toBe(count);
  });

  it('does not overflow when random() returns its exclusive upper bound', () => {
    expect(pickIndex(5, () => 0.999999999)).toBe(4);
  });
});
