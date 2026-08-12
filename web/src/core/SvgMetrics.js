const SVG_TAG_RE = /<svg\b([^>]*)>/i;
const DRAWABLE_RE = /<(line|path|circle|ellipse|polyline|polygon|rect)\b([^>]*)\/?\s*>/gi;
const ATTR_RE = /([a-zA-Z_:][\w:.-]*)=['"]([^'"]*)['"]/g;
const NUMBER_RE = /-?\d+(?:\.\d+)?/g;

export function analyzeSvgMetrics(svg) {
  const page = readPage(svg);
  const layerItems = [];
  const elements = {
    totalDrawable: 0,
    lineCount: 0,
    pathCount: 0,
    unparseableCount: 0,
  };
  let parseableLength = 0;
  const boundsPoints = [];

  const layers = readLayers(svg);
  const drawableSources = layers.length ? layers : [{ id: null, content: svg }];

  for (const layer of drawableSources) {
    let elementCount = 0;
    for (const drawable of readDrawableElements(layer.content)) {
      elementCount += 1;
      elements.totalDrawable += 1;

      const parsed = analyzeDrawable(drawable, elements);
      if (parsed) {
        parseableLength += parsed.length;
        boundsPoints.push(...parsed.points);
      }
    }
    if (layer.id) {
      layerItems.push({ id: layer.id, elementCount });
    }
  }

  return {
    page,
    layers: {
      count: layerItems.length,
      items: layerItems,
    },
    elements,
    length: {
      parseable: parseableLength,
    },
    bounds: buildBounds(boundsPoints, page),
  };
}

function readPage(svg) {
  const svgAttrs = parseAttributes(svg.match(SVG_TAG_RE)?.[1] ?? '');
  const width = parseFloat(svgAttrs.width);
  const height = parseFloat(svgAttrs.height);
  if (Number.isFinite(width) && Number.isFinite(height)) {
    return { width, height };
  }

  const viewBoxNumbers = parseNumbers(svgAttrs.viewBox);
  if (viewBoxNumbers.length === 4) {
    return { width: viewBoxNumbers[2], height: viewBoxNumbers[3] };
  }

  return { width: null, height: null };
}

function readLayers(svg) {
  const layers = [];
  const layerOpenRe = /<g\b([^>]*)id=['"](layer_[^'"]+)['"]([^>]*)>/gi;
  let match;

  while ((match = layerOpenRe.exec(svg)) !== null) {
    const start = match.index + match[0].length;
    const end = findMatchingGroupClose(svg, start);
    layers.push({
      id: match[2],
      content: svg.slice(start, end),
    });
    layerOpenRe.lastIndex = end;
  }

  return layers;
}

function findMatchingGroupClose(svg, startIndex) {
  const groupTagRe = /<\/?g\b[^>]*>/gi;
  groupTagRe.lastIndex = startIndex;
  let depth = 1;
  let match;

  while ((match = groupTagRe.exec(svg)) !== null) {
    if (match[0].startsWith('</g')) {
      depth -= 1;
      if (depth === 0) {
        return match.index;
      }
    } else if (!match[0].endsWith('/>')) {
      depth += 1;
    }
  }

  return svg.length;
}

function readDrawableElements(content) {
  const drawables = [];
  let match;
  while ((match = DRAWABLE_RE.exec(content)) !== null) {
    drawables.push({ name: match[1], attrs: parseAttributes(match[2]) });
  }
  return drawables;
}

function analyzeDrawable(drawable, elements) {
  if (drawable.name === 'line') {
    elements.lineCount += 1;
    const parsed = parseLine(drawable.attrs);
    if (parsed) return parsed;
  } else if (drawable.name === 'path') {
    elements.pathCount += 1;
    const parsed = parseSimplePath(drawable.attrs.d);
    if (parsed) return parsed;
  }

  elements.unparseableCount += 1;
  return null;
}

function parseAttributes(source) {
  const attrs = {};
  let match;
  while ((match = ATTR_RE.exec(source)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function parseLine(attrs) {
  const x1 = parseFloat(attrs.x1);
  const y1 = parseFloat(attrs.y1);
  const x2 = parseFloat(attrs.x2);
  const y2 = parseFloat(attrs.y2);
  if (![x1, y1, x2, y2].every(Number.isFinite)) return null;
  const points = [[x1, y1], [x2, y2]];
  return { points, length: distance(points[0], points[1]) };
}

function parseSimplePath(pathData) {
  if (!pathData || /[^\s\d.,MLml-]/.test(pathData)) return null;
  const numbers = parseNumbers(pathData);
  if (numbers.length < 4 || numbers.length % 2 !== 0) return null;

  const points = [];
  for (let i = 0; i < numbers.length; i += 2) {
    points.push([numbers[i], numbers[i + 1]]);
  }

  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += distance(points[i - 1], points[i]);
  }
  return { points, length };
}

function parseNumbers(value = '') {
  return (value.match(NUMBER_RE) ?? []).map(Number);
}

function distance(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function buildBounds(points, page) {
  if (!points.length) {
    return null;
  }

  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const bounds = {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };

  return {
    ...bounds,
    withinPage: isWithinPage(bounds, page),
  };
}

function isWithinPage(bounds, page) {
  if (!Number.isFinite(page.width) || !Number.isFinite(page.height)) return null;
  return bounds.minX >= 0
    && bounds.minY >= 0
    && bounds.maxX <= page.width
    && bounds.maxY <= page.height;
}
