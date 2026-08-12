import { analyzeSvgMetrics } from './SvgMetrics.js';

export function buildSvgDiagnosticsViewModel(svg) {
  if (typeof svg === 'string' && svg.trim() === '') {
    return {
      status: 'empty',
      text: 'Generate art to see plotter diagnostics.',
      compactText: 'Generate for diagnostics',
      title: 'No SVG generated yet',
    };
  }

  try {
    const metrics = analyzeSvgMetrics(svg);
    const compactLayerLabel = pluralize(metrics.layers.count, 'layer', 'layers');
    const compactElementLabel = pluralize(metrics.elements.totalDrawable, 'elem', 'elems');
    const lengthText = formatMeters(metrics.length.parseable);
    const boundsText = formatBounds(metrics.bounds);

    return {
      status: 'ok',
      text: `Layers: ${metrics.layers.count} · Elements: ${metrics.elements.totalDrawable} · Parseable length: ${lengthText} · Bounds: ${boundsText}`,
      compactText: `${compactLayerLabel} · ${compactElementLabel} · ${lengthText} · ${boundsText}`,
      title: buildTitle(metrics),
      metrics,
    };
  } catch (error) {
    return {
      status: 'error',
      text: 'Plotter diagnostics unavailable.',
      compactText: 'Diagnostics unavailable',
      title: error instanceof Error ? error.message : 'Unable to analyze SVG metrics',
    };
  }
}

export function formatMeters(lengthMillimeters) {
  if (!Number.isFinite(lengthMillimeters)) return 'unknown length';
  return `${(lengthMillimeters / 1000).toFixed(1)} m`;
}

function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatBounds(bounds) {
  if (!bounds) return 'unknown';
  if (bounds.withinPage === true) return 'within page';
  if (bounds.withinPage === false) return 'exceeds page';
  return 'unknown page';
}

function buildTitle(metrics) {
  const page = metrics.page.width && metrics.page.height
    ? `Page: ${metrics.page.width} × ${metrics.page.height}`
    : 'Page: unknown';
  const lines = `Lines: ${metrics.elements.lineCount}`;
  const paths = `Paths: ${metrics.elements.pathCount}`;
  const unparseable = `Unparseable: ${metrics.elements.unparseableCount}`;
  const limitations = metrics.limitations?.length ? `Limitations: ${metrics.limitations.join(' ')}` : '';
  return [page, lines, paths, unparseable, limitations].filter(Boolean).join(' · ');
}
