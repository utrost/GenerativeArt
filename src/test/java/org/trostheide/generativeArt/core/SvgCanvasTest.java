package org.trostheide.generativeArt.core;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SvgCanvasTest {

    @Test
    void toSvgContainsCorrectDimensions() {
        SvgCanvas canvas = new SvgCanvas(800, 600, 1);
        String svg = canvas.toSvg();

        assertTrue(svg.contains("width='800.0'"));
        assertTrue(svg.contains("height='600.0'"));
        assertTrue(svg.contains("viewBox='0 0 800.0 600.0'"));
    }

    @Test
    void toSvgContainsSvgTags() {
        SvgCanvas canvas = new SvgCanvas(100, 100, 1);
        String svg = canvas.toSvg();

        assertTrue(svg.startsWith("<svg"));
        assertTrue(svg.endsWith("</svg>"));
    }

    @Test
    void toSvgContainsClipPathAndBackground() {
        SvgCanvas canvas = new SvgCanvas(200, 300, 1);
        String svg = canvas.toSvg();

        assertTrue(svg.contains("<defs><clipPath id='pageClip'>"));
        assertTrue(svg.contains("fill='white'"));
    }

    @Test
    void singleLayerUsesBlackStroke() {
        SvgCanvas canvas = new SvgCanvas(100, 100, 1);
        String svg = canvas.toSvg();

        assertTrue(svg.contains("id='layer_1'"));
        assertTrue(svg.contains("stroke='black'"));
    }

    @Test
    void multipleLayersUseDistinctColors() {
        SvgCanvas canvas = new SvgCanvas(100, 100, 3);
        String svg = canvas.toSvg();

        assertTrue(svg.contains("id='layer_1'"));
        assertTrue(svg.contains("id='layer_2'"));
        assertTrue(svg.contains("id='layer_3'"));
        assertTrue(svg.contains("stroke='black'"));
        assertTrue(svg.contains("stroke='#E31A1C'"));
        assertTrue(svg.contains("stroke='#1F78B4'"));
    }

    @Test
    void addLineAppendsToCorrectLayer() {
        SvgCanvas canvas = new SvgCanvas(100, 100, 2);
        canvas.addLine(0, 10, 20, 30, 40);
        String svg = canvas.toSvg();

        assertTrue(svg.contains("<line x1='10.00' y1='20.00' x2='30.00' y2='40.00' />"));
    }

    @Test
    void addPathAppendsToCorrectLayer() {
        SvgCanvas canvas = new SvgCanvas(100, 100, 2);
        canvas.addPath(1, "<circle cx='50' cy='50' r='25' />");
        String svg = canvas.toSvg();

        assertTrue(svg.contains("<circle cx='50' cy='50' r='25' />"));
    }

    @Test
    void addPathIgnoresInvalidLayerIndex() {
        SvgCanvas canvas = new SvgCanvas(100, 100, 1);
        // Should not throw
        canvas.addPath(-1, "<circle />");
        canvas.addPath(5, "<circle />");
        String svg = canvas.toSvg();
        assertFalse(svg.contains("<circle />"));
    }

    @Test
    void addRawAppendsContent() {
        SvgCanvas canvas = new SvgCanvas(100, 100, 1);
        canvas.addRaw(0, "<text>Hello</text>");
        String svg = canvas.toSvg();

        assertTrue(svg.contains("<text>Hello</text>"));
    }

    @Test
    void setStrokeWidthAffectsOutput() {
        SvgCanvas canvas = new SvgCanvas(100, 100, 1);
        canvas.setStrokeWidth(2.5);
        String svg = canvas.toSvg();

        assertTrue(svg.contains("stroke-width='2.50'"));
    }

    @Test
    void defaultStrokeWidthIsOne() {
        SvgCanvas canvas = new SvgCanvas(100, 100, 1);
        String svg = canvas.toSvg();

        assertTrue(svg.contains("stroke-width='1.00'"));
    }

    @Test
    void zeroLayersProducesEmptySvg() {
        SvgCanvas canvas = new SvgCanvas(100, 100, 0);
        String svg = canvas.toSvg();

        assertTrue(svg.contains("<svg"));
        assertTrue(svg.contains("</svg>"));
        assertFalse(svg.contains("id='layer_"));
    }
}
