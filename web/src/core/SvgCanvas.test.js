import { describe, it, expect } from 'vitest';
import { SvgCanvas } from './SvgCanvas.js';

describe('SvgCanvas', () => {
    it('produces SVG with correct dimensions', () => {
        const canvas = new SvgCanvas(800, 600, 1);
        const svg = canvas.toSvg();

        expect(svg).toContain("width='800.0'");
        expect(svg).toContain("height='600.0'");
        expect(svg).toContain("viewBox='0 0 800.0 600.0'");
    });

    it('produces valid SVG tags', () => {
        const canvas = new SvgCanvas(100, 100, 1);
        const svg = canvas.toSvg();

        expect(svg).toMatch(/^<svg/);
        expect(svg).toMatch(/<\/svg>$/);
    });

    it('contains clip path and white background', () => {
        const canvas = new SvgCanvas(200, 300, 1);
        const svg = canvas.toSvg();

        expect(svg).toContain("<defs><clipPath id='pageClip'>");
        expect(svg).toContain("fill='white'");
    });

    it('single layer uses black stroke', () => {
        const canvas = new SvgCanvas(100, 100, 1);
        const svg = canvas.toSvg();

        expect(svg).toContain("id='layer_1'");
        expect(svg).toContain("stroke='black'");
    });

    it('multiple layers use distinct colors', () => {
        const canvas = new SvgCanvas(100, 100, 3);
        const svg = canvas.toSvg();

        expect(svg).toContain("id='layer_1'");
        expect(svg).toContain("id='layer_2'");
        expect(svg).toContain("id='layer_3'");
        expect(svg).toContain("stroke='black'");
        expect(svg).toContain("stroke='#E31A1C'");
        expect(svg).toContain("stroke='#1F78B4'");
    });

    it('addLine appends line element', () => {
        const canvas = new SvgCanvas(100, 100, 1);
        canvas.addLine(0, 10, 20, 30, 40);
        const svg = canvas.toSvg();

        expect(svg).toContain("x1='10.00'");
        expect(svg).toContain("y1='20.00'");
        expect(svg).toContain("x2='30.00'");
        expect(svg).toContain("y2='40.00'");
    });

    it('addPath appends to correct layer', () => {
        const canvas = new SvgCanvas(100, 100, 2);
        canvas.addPath(1, "<circle cx='50' cy='50' r='25' />");
        const svg = canvas.toSvg();

        expect(svg).toContain("<circle cx='50' cy='50' r='25' />");
    });

    it('addPath ignores invalid layer index', () => {
        const canvas = new SvgCanvas(100, 100, 1);
        canvas.addPath(-1, '<circle />');
        canvas.addPath(5, '<circle />');
        const svg = canvas.toSvg();

        expect(svg).not.toContain('<circle />');
    });

    it('addRaw appends content', () => {
        const canvas = new SvgCanvas(100, 100, 1);
        canvas.addRaw(0, '<text>Hello</text>');
        const svg = canvas.toSvg();

        expect(svg).toContain('<text>Hello</text>');
    });

    it('setStrokeWidth affects output', () => {
        const canvas = new SvgCanvas(100, 100, 1);
        canvas.setStrokeWidth(2.5);
        const svg = canvas.toSvg();

        expect(svg).toContain("stroke-width='2.50'");
    });

    it('default stroke width is 1', () => {
        const canvas = new SvgCanvas(100, 100, 1);
        const svg = canvas.toSvg();

        expect(svg).toContain("stroke-width='1.00'");
    });

    it('zero layers produces SVG without layer groups', () => {
        const canvas = new SvgCanvas(100, 100, 0);
        const svg = canvas.toSvg();

        expect(svg).toContain('<svg');
        expect(svg).toContain('</svg>');
        expect(svg).not.toContain("id='layer_");
    });
});
