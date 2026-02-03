export const PaperSize = {
    A4_PORTRAIT: { name: "A4 (Portrait)", widthMm: 210, heightMm: 297 },
    A4_LANDSCAPE: { name: "A4 (Landscape)", widthMm: 297, heightMm: 210 },
    A3_PORTRAIT: { name: "A3 (Portrait)", widthMm: 297, heightMm: 420 },
    A3_LANDSCAPE: { name: "A3 (Landscape)", widthMm: 420, heightMm: 297 },
    LETTER_PORTRAIT: { name: "Letter (Portrait)", widthMm: 216, heightMm: 279 },
    LETTER_LANDSCAPE: { name: "Letter (Landscape)", widthMm: 279, heightMm: 216 },
    SCREEN_1000: { name: "Screen (1000x1000)", widthMm: 264.58, heightMm: 264.58 } // 1000px approx
};

export function getPaperDimensionsPx(paperSizeKey) {
    const paper = PaperSize[paperSizeKey] || PaperSize.A4_PORTRAIT;
    // 96 DPI: pixels = (mm / 25.4) * 96
    const width = (paper.widthMm / 25.4) * 96;
    const height = (paper.heightMm / 25.4) * 96;
    return { width, height };
}
