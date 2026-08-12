import { describe, expect, it } from 'vitest';
import { buildSvgDiagnosticsViewModel, formatMeters } from './SvgDiagnostics.js';

describe('SVG diagnostics view model', () => {
  it('shows a clear empty state before any SVG has been generated', () => {
    expect(buildSvgDiagnosticsViewModel('')).toEqual({
      status: 'empty',
      text: 'Generate art to see plotter diagnostics.',
      compactText: 'Generate for diagnostics',
      title: 'No SVG generated yet',
    });
  });

  it('formats generated SVG metrics for desktop and compact mobile UI', () => {
    const svg = `
      <svg width="200" height="100">
        <g id="layer_1"><line x1="0" y1="0" x2="100" y2="0" /></g>
        <g id="layer_2"><path d="M 0 0 L 0 100" /></g>
      </svg>`;

    const viewModel = buildSvgDiagnosticsViewModel(svg);

    expect(viewModel.status).toBe('ok');
    expect(viewModel.text).toBe('Layers: 2 · Elements: 2 · Parseable length: 0.2 m · Bounds: within page');
    expect(viewModel.compactText).toBe('2 layers · 2 elems · 0.2 m · within page');
    expect(viewModel.title).toContain('Page: 200 × 100');
  });

  it('states when generated SVG bounds exceed the page', () => {
    const svg = '<svg width="20" height="20"><line x1="0" y1="0" x2="30" y2="0" /></svg>';

    expect(buildSvgDiagnosticsViewModel(svg).text).toContain('Bounds: exceeds page');
  });

  it('shows an error state when metrics analysis fails', () => {
    const viewModel = buildSvgDiagnosticsViewModel(null);

    expect(viewModel.status).toBe('error');
    expect(viewModel.text).toBe('Plotter diagnostics unavailable.');
    expect(viewModel.compactText).toBe('Diagnostics unavailable');
  });

  it('formats millimeter length as meters with one decimal place', () => {
    expect(formatMeters(18400)).toBe('18.4 m');
  });
});
