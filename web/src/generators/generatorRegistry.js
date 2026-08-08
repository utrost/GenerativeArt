import { GenerativeRibbon } from './GenerativeRibbon';
import { FlowFieldGenerator } from './FlowFieldGenerator';
import { CirclePackingGenerator } from './CirclePackingGenerator';
import { LSystemGenerator } from './LSystemGenerator';
import { ReactionDiffusionGenerator } from './ReactionDiffusionGenerator';
import { HarmonographGenerator } from './HarmonographGenerator';
import { PhyllotaxisGenerator } from './PhyllotaxisGenerator';
import { StrangeAttractorsGenerator } from './StrangeAttractorsGenerator';
import { TruchetTilesGenerator } from './TruchetTilesGenerator';
import { TwistedMoireGenerator } from './TwistedMoireGenerator';
import { VoronoiRipplesGenerator } from './VoronoiRipplesGenerator';
import { PipeNetworkGenerator } from './PipeNetworkGenerator';
import { ParametricGridGenerator } from './ParametricGridGenerator';
import { MagneticFieldGenerator } from './MagneticFieldGenerator';
import { FourierSeriesGenerator } from './FourierSeriesGenerator';
import { MazeGenerator } from './MazeGenerator';
import { SpirographGenerator } from './SpirographGenerator';
import { PenroseTilingGenerator } from './PenroseTilingGenerator';
import { WaveInterferenceGenerator } from './WaveInterferenceGenerator';
import { ChladniPatternGenerator } from './ChladniPatternGenerator';
import { CelticKnotGenerator } from './CelticKnotGenerator';
import { ContourMapGenerator } from './ContourMapGenerator';
import { CapsuleInterferenceGenerator } from './CapsuleInterferenceGenerator';
import { FoldedCrystalGenerator } from './FoldedCrystalGenerator';
import { CrumpledMeshGenerator } from './CrumpledMeshGenerator';
import { FaultLinesGenerator } from './FaultLinesGenerator';
import { ThreadLoomGenerator } from './ThreadLoomGenerator';
import { BotanicalCircuitGenerator } from './BotanicalCircuitGenerator';
import { BotanicalGestureGenerator } from './BotanicalGestureGenerator';
import { PaperMemoryGenerator } from './PaperMemoryGenerator';
import { MechanicalRainGenerator } from './MechanicalRainGenerator';
import { ArchiveShardsGenerator } from './ArchiveShardsGenerator';
import { ResonantTopographyGenerator } from './ResonantTopographyGenerator';

export const CATEGORY_LABELS = [
  'All',
  'Line fields',
  'Geometry / tiling',
  'Organic / natural systems',
  'Math / physics',
  'Constructed systems / diagrams',
  'Plotter studies',
];

const meta = (create, category, tags, description) => {
  const instance = create();
  return { id: instance.getId(), name: instance.getDisplayName(), category, tags, description, create };
};

export const generatorRegistry = [
  meta(() => new GenerativeRibbon(), 'Line fields', ['ribbon', 'moire', 'linework', 'plotter'], 'Twisted ribbon bundles with moire-like line interference.'),
  meta(() => new FlowFieldGenerator(), 'Line fields', ['flow', 'particles', 'noise', 'organic'], 'Particle paths steered through Perlin-style flow fields.'),
  meta(() => new CirclePackingGenerator(), 'Geometry / tiling', ['circles', 'packing', 'geometry'], 'Space-filling non-overlapping circles for dense geometric plots.'),
  meta(() => new LSystemGenerator(), 'Organic / natural systems', ['fractal', 'plant', 'recursive'], 'Rule-based recursive fractals including dragon and fern-like systems.'),
  meta(() => new ReactionDiffusionGenerator(), 'Organic / natural systems', ['reaction', 'diffusion', 'biology', 'texture'], 'Biological Gray-Scott style pattern formation.'),
  meta(() => new HarmonographGenerator(), 'Math / physics', ['pendulum', 'harmonograph', 'curves'], 'Mechanical pendulum curves and layered harmonic motion.'),
  meta(() => new PhyllotaxisGenerator(), 'Organic / natural systems', ['sunflower', 'spiral', 'golden-angle'], 'Golden-angle phyllotaxis spirals and seed-head structures.'),
  meta(() => new StrangeAttractorsGenerator(), 'Math / physics', ['chaos', 'attractor', 'clifford'], 'Chaotic attractor traces such as Clifford systems.'),
  meta(() => new TruchetTilesGenerator(), 'Geometry / tiling', ['tiles', 'maze', 'geometry'], 'Maze-like geometric tessellations from Truchet tiles.'),
  meta(() => new TwistedMoireGenerator(), 'Line fields', ['moire', 'grid', 'interference'], 'Overlapping distorted grids that create optical interference.'),
  meta(() => new VoronoiRipplesGenerator(), 'Geometry / tiling', ['voronoi', 'ripples', 'cells'], 'Concentric clipped ripples inside Voronoi cells.'),
  meta(() => new PipeNetworkGenerator(), 'Constructed systems / diagrams', ['pipes', 'network', 'wfc', 'system'], 'Industrial pipe networks generated from constrained tiles.'),
  meta(() => new ParametricGridGenerator(), 'Geometry / tiling', ['grid', 'parametric', 'order-chaos'], 'Ordered grids that decay into controlled visual chaos.'),
  meta(() => new MagneticFieldGenerator(), 'Line fields', ['field', 'magnetic', 'particles', 'physics'], 'Particle trajectories pulled around magnetic poles.'),
  meta(() => new FourierSeriesGenerator(), 'Math / physics', ['fourier', 'waves', 'harmonics'], 'Wave summation and harmonic series visualizations.'),
  meta(() => new MazeGenerator(), 'Constructed systems / diagrams', ['maze', 'path', 'system'], 'Perfect solvable mazes with optional solution structure.'),
  meta(() => new SpirographGenerator(), 'Math / physics', ['spirograph', 'epicycloid', 'curves'], 'Epicycloid and hypocycloid drawing-machine curves.'),
  meta(() => new PenroseTilingGenerator(), 'Geometry / tiling', ['penrose', 'tiling', 'aperiodic'], 'Aperiodic kite-and-dart tilings with five-fold symmetry.'),
  meta(() => new WaveInterferenceGenerator(), 'Math / physics', ['waves', 'interference', 'sources'], 'Overlapping circular wave fields from multiple sources.'),
  meta(() => new ChladniPatternGenerator(), 'Math / physics', ['chladni', 'resonance', 'sound'], 'Resonance patterns inspired by vibrating plates.'),
  meta(() => new CelticKnotGenerator(), 'Constructed systems / diagrams', ['knot', 'interlace', 'ornament'], 'Interlaced knotwork structures with constructed over-under paths.'),
  meta(() => new ContourMapGenerator(), 'Organic / natural systems', ['contour', 'topography', 'terrain', 'plotter'], 'Topographic contour lines from procedural terrain.'),
  meta(() => new CapsuleInterferenceGenerator(), 'Plotter studies', ['capsule', 'interference', 'multi-pen', 'plotter'], 'Overlapping rounded-rectangle contour stacks for pen studies.'),
  meta(() => new FoldedCrystalGenerator(), 'Plotter studies', ['folded', 'crystal', 'hatching', 'plotter'], 'Faceted polygon clusters with clipped hatch shading.'),
  meta(() => new CrumpledMeshGenerator(), 'Plotter studies', ['mesh', 'crumpled', 'wireframe', 'plotter'], 'Warped wireframe relief sheets for technical-pen studies.'),
  meta(() => new FaultLinesGenerator(), 'Plotter studies', ['fault', 'contour', 'geology', 'stress', 'plotter'], 'Contour fields sheared by tectonic cracks and stress ticks.'),
  meta(() => new ThreadLoomGenerator(), 'Line fields', ['thread', 'loom', 'weaving', 'moire', 'multi-pen', 'plotter'], 'Sagging thread curves woven between frame anchors.'),
  meta(() => new BotanicalCircuitGenerator(), 'Organic / natural systems', ['botanical', 'circuit', 'pcb', 'vias', 'plotter'], 'Plant-like branching constrained by PCB-style routing.'),
  meta(() => new BotanicalGestureGenerator(), 'Organic / natural systems', ['botanical', 'flower', 'rose', 'tree', 'gesture', 'plotter'], 'Loose flower and tree sketches made from repeated pen gestures.'),
  meta(() => new PaperMemoryGenerator(), 'Plotter studies', ['paper', 'crease', 'fold', 'rubbing', 'plotter'], 'Recent and ghost paper creases with sparse rubbing marks.'),
  meta(() => new MechanicalRainGenerator(), 'Line fields', ['rain', 'deflector', 'physics', 'plotter'], 'Falling trajectories deflected by pins, paddles, and wind.'),
  meta(() => new ArchiveShardsGenerator(), 'Constructed systems / diagrams', ['archive', 'metadata', 'diagram', 'shards', 'links'], 'Fragmented document rectangles clustered by hidden metadata axes.'),
  meta(() => new ResonantTopographyGenerator(), 'Organic / natural systems', ['resonance', 'topography', 'contour', 'chladni', 'plotter'], 'Topographic contours broken by standing-wave resonance nodes.'),
];

const FAVORITES_KEY = 'genart:favorites';
const RECENTS_KEY = 'genart:recents';

export function createGeneratorInstances() {
  return generatorRegistry.map((entry) => entry.create());
}

export function filterGeneratorEntries(entries, { query = '', category = 'All' } = {}) {
  const needle = query.trim().toLowerCase();
  return entries.filter((entry) => {
    const categoryMatches = !category || category === 'All' || entry.category === category || entry.tags.includes(category.toLowerCase());
    if (!categoryMatches) return false;
    if (!needle) return true;
    return [entry.name, entry.category, entry.description, ...entry.tags].some((value) => value.toLowerCase().includes(needle));
  });
}

function readList(storage, key) {
  if (!storage) return [];
  try {
    const value = storage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeList(storage, key, value) {
  if (!storage) return value;
  storage.setItem(key, JSON.stringify(value));
  return value;
}

export function getFavoriteGeneratorIds(storage = globalThis.localStorage) {
  return readList(storage, FAVORITES_KEY);
}

export function toggleFavoriteGeneratorId(id, storage = globalThis.localStorage) {
  const current = getFavoriteGeneratorIds(storage);
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  return writeList(storage, FAVORITES_KEY, next);
}

export function getRecentGeneratorIds(storage = globalThis.localStorage) {
  return readList(storage, RECENTS_KEY);
}

export function rememberRecentGeneratorId(id, storage = globalThis.localStorage) {
  const next = [id, ...getRecentGeneratorIds(storage).filter((item) => item !== id)].slice(0, 5);
  return writeList(storage, RECENTS_KEY, next);
}

export function randomEntry(entries) {
  if (!entries.length) return null;
  return entries[Math.floor(Math.random() * entries.length)];
}
