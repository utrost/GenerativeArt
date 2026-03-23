import { describe, it, expect } from 'vitest';
import { PaperSize, getPaperDimensionsPx } from './PaperSize.js';

describe('PaperSize', () => {
    it('A4 portrait has correct dimensions', () => {
        expect(PaperSize.A4_PORTRAIT.widthMm).toBe(210);
        expect(PaperSize.A4_PORTRAIT.heightMm).toBe(297);
    });

    it('A4 landscape has swapped dimensions', () => {
        expect(PaperSize.A4_LANDSCAPE.widthMm).toBe(297);
        expect(PaperSize.A4_LANDSCAPE.heightMm).toBe(210);
    });

    it('A3 portrait has correct dimensions', () => {
        expect(PaperSize.A3_PORTRAIT.widthMm).toBe(297);
        expect(PaperSize.A3_PORTRAIT.heightMm).toBe(420);
    });

    it('Letter portrait has correct dimensions', () => {
        expect(PaperSize.LETTER_PORTRAIT.widthMm).toBe(216);
        expect(PaperSize.LETTER_PORTRAIT.heightMm).toBe(279);
    });

    it('all sizes have positive dimensions', () => {
        for (const key of Object.keys(PaperSize)) {
            const size = PaperSize[key];
            expect(size.widthMm).toBeGreaterThan(0);
            expect(size.heightMm).toBeGreaterThan(0);
        }
    });

    it('all sizes have display names', () => {
        for (const key of Object.keys(PaperSize)) {
            expect(PaperSize[key].name).toBeTruthy();
            expect(PaperSize[key].name.length).toBeGreaterThan(0);
        }
    });
});

describe('getPaperDimensionsPx', () => {
    it('converts A4 portrait correctly', () => {
        const { width, height } = getPaperDimensionsPx('A4_PORTRAIT');
        const expectedWidth = (210 / 25.4) * 96;
        const expectedHeight = (297 / 25.4) * 96;

        expect(width).toBeCloseTo(expectedWidth, 1);
        expect(height).toBeCloseTo(expectedHeight, 1);
    });

    it('returns positive pixel values', () => {
        for (const key of Object.keys(PaperSize)) {
            const { width, height } = getPaperDimensionsPx(key);
            expect(width).toBeGreaterThan(0);
            expect(height).toBeGreaterThan(0);
        }
    });

    it('falls back to A4 portrait for unknown key', () => {
        const { width, height } = getPaperDimensionsPx('UNKNOWN');
        const expected = getPaperDimensionsPx('A4_PORTRAIT');

        expect(width).toBe(expected.width);
        expect(height).toBe(expected.height);
    });

    it('landscape width is larger than height', () => {
        const a4l = getPaperDimensionsPx('A4_LANDSCAPE');
        expect(a4l.width).toBeGreaterThan(a4l.height);
    });
});
