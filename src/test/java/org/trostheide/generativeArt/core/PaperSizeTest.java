package org.trostheide.generativeArt.core;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

class PaperSizeTest {

    @Test
    void a4PortraitHasCorrectDimensions() {
        assertEquals(210, PaperSize.A4_PORTRAIT.getWidthMm());
        assertEquals(297, PaperSize.A4_PORTRAIT.getHeightMm());
    }

    @Test
    void a4LandscapeHasSwappedDimensions() {
        assertEquals(297, PaperSize.A4_LANDSCAPE.getWidthMm());
        assertEquals(210, PaperSize.A4_LANDSCAPE.getHeightMm());
    }

    @Test
    void a3PortraitHasCorrectDimensions() {
        assertEquals(297, PaperSize.A3_PORTRAIT.getWidthMm());
        assertEquals(420, PaperSize.A3_PORTRAIT.getHeightMm());
    }

    @Test
    void letterPortraitHasCorrectDimensions() {
        assertEquals(216, PaperSize.LETTER_PORTRAIT.getWidthMm());
        assertEquals(279, PaperSize.LETTER_PORTRAIT.getHeightMm());
    }

    @ParameterizedTest
    @EnumSource(PaperSize.class)
    void allSizesHavePositiveDimensions(PaperSize size) {
        assertTrue(size.getWidthMm() > 0);
        assertTrue(size.getHeightMm() > 0);
        assertTrue(size.getWidthPx() > 0);
        assertTrue(size.getHeightPx() > 0);
    }

    @ParameterizedTest
    @EnumSource(PaperSize.class)
    void allSizesHaveDisplayNames(PaperSize size) {
        assertNotNull(size.getDisplayName());
        assertFalse(size.getDisplayName().isBlank());
    }

    @Test
    void pixelConversionIsCorrect() {
        // A4 Portrait: 210mm -> (210/25.4)*96 ≈ 793.7 px
        double expectedWidth = (210.0 / 25.4) * 96;
        assertEquals(expectedWidth, PaperSize.A4_PORTRAIT.getWidthPx(), 0.01);
    }

    @Test
    void landscapeWidthIsLargerThanHeight() {
        assertTrue(PaperSize.A4_LANDSCAPE.getWidthMm() > PaperSize.A4_LANDSCAPE.getHeightMm());
        assertTrue(PaperSize.A3_LANDSCAPE.getWidthMm() > PaperSize.A3_LANDSCAPE.getHeightMm());
    }

    @Test
    void portraitHeightIsLargerThanWidth() {
        assertTrue(PaperSize.A4_PORTRAIT.getHeightMm() > PaperSize.A4_PORTRAIT.getWidthMm());
        assertTrue(PaperSize.A3_PORTRAIT.getHeightMm() > PaperSize.A3_PORTRAIT.getWidthMm());
    }
}
