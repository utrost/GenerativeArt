import { describe, it, expect } from 'vitest';
import { SeededRandom } from './SeededRandom.js';

describe('SeededRandom', () => {
    it('nextDouble returns value between 0 and 1', () => {
        const rng = new SeededRandom(42);
        for (let i = 0; i < 100; i++) {
            const val = rng.nextDouble();
            expect(val).toBeGreaterThanOrEqual(0);
            expect(val).toBeLessThan(1);
        }
    });

    it('nextInt returns value between 0 and bound (exclusive)', () => {
        const rng = new SeededRandom(42);
        for (let i = 0; i < 100; i++) {
            const val = rng.nextInt(10);
            expect(val).toBeGreaterThanOrEqual(0);
            expect(val).toBeLessThan(10);
            expect(Number.isInteger(val)).toBe(true);
        }
    });

    it('same seed produces same sequence', () => {
        const rng1 = new SeededRandom(123);
        const rng2 = new SeededRandom(123);

        for (let i = 0; i < 50; i++) {
            expect(rng1.nextDouble()).toBe(rng2.nextDouble());
        }
    });

    it('different seeds produce different sequences', () => {
        const rng1 = new SeededRandom(1);
        const rng2 = new SeededRandom(999);

        let anyDifferent = false;
        for (let i = 0; i < 10; i++) {
            if (rng1.nextDouble() !== rng2.nextDouble()) {
                anyDifferent = true;
                break;
            }
        }
        expect(anyDifferent).toBe(true);
    });
});
