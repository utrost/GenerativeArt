package org.trostheide.generativeArt.core;

public enum PaperSize {
    A4_PORTRAIT("A4 (Portrait)", 210, 297),
    A4_LANDSCAPE("A4 (Landscape)", 297, 210),
    A3_PORTRAIT("A3 (Portrait)", 297, 420),
    A3_LANDSCAPE("A3 (Landscape)", 420, 297),
    LETTER_PORTRAIT("Letter (Portrait)", 216, 279), // 8.5 x 11 inches approx 216x279 mm
    LETTER_LANDSCAPE("Letter (Landscape)", 279, 216);

    private final String displayName;
    private final int widthMm;
    private final int heightMm;

    PaperSize(String displayName, int widthMm, int heightMm) {
        this.displayName = displayName;
        this.widthMm = widthMm;
        this.heightMm = heightMm;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getWidthMm() {
        return widthMm;
    }

    public int getHeightMm() {
        return heightMm;
    }

    // Convert mm to pixels at 96 DPI (Standard for SVG/Screen)
    // 1 inch = 25.4 mm
    // pixels = (mm / 25.4) * 96
    public double getWidthPx() {
        return (widthMm / 25.4) * 96;
    }

    public double getHeightPx() {
        return (heightMm / 25.4) * 96;
    }
}
