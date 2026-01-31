import { GenerativeRibbon } from './generators/GenerativeRibbon';
import { FlowFieldGenerator } from './generators/FlowFieldGenerator';
import { CirclePackingGenerator } from './generators/CirclePackingGenerator';
import { LSystemGenerator } from './generators/LSystemGenerator';
import { ReactionDiffusionGenerator } from './generators/ReactionDiffusionGenerator';
import { HarmonographGenerator } from './generators/HarmonographGenerator';
import { PhyllotaxisGenerator } from './generators/PhyllotaxisGenerator';
import { StrangeAttractorsGenerator } from './generators/StrangeAttractorsGenerator';
import { TruchetTilesGenerator } from './generators/TruchetTilesGenerator';
import { TwistedMoireGenerator } from './generators/TwistedMoireGenerator';
import { VoronoiRipplesGenerator } from './generators/VoronoiRipplesGenerator';
import { PipeNetworkGenerator } from './generators/PipeNetworkGenerator';
import { ParametricGridGenerator } from './generators/ParametricGridGenerator';
import { MagneticFieldGenerator } from './generators/MagneticFieldGenerator';
import { FourierSeriesGenerator } from './generators/FourierSeriesGenerator';
import { MazeGenerator } from './generators/MazeGenerator';
import { SpirographGenerator } from './generators/SpirographGenerator';

import { PaperSize, getPaperDimensionsPx } from './core/PaperSize';
import { HelpSystem } from './core/HelpSystem';

const generators = [
  new GenerativeRibbon(),
  new FlowFieldGenerator(),
  new CirclePackingGenerator(),
  new LSystemGenerator(),
  new ReactionDiffusionGenerator(),
  new HarmonographGenerator(),
  new PhyllotaxisGenerator(),
  new StrangeAttractorsGenerator(),
  new TruchetTilesGenerator(),
  new TwistedMoireGenerator(),
  new VoronoiRipplesGenerator(),
  new PipeNetworkGenerator(),
  new ParametricGridGenerator(),
  new MagneticFieldGenerator(),
  new FourierSeriesGenerator(),
  new MazeGenerator(),
  new SpirographGenerator()
];

let activeGenerator = generators[0];
let currentParams = {};
let currentPaperSize = "A4_PORTRAIT"; // Default

const generatorListEl = document.getElementById('generator-list');
const activeNameEl = document.getElementById('active-generator-name');
const controlsContainer = document.getElementById('controls-container');
const artOutput = document.getElementById('art-output');
const generateBtn = document.getElementById('btn-generate');
const downloadBtn = document.getElementById('btn-download');

// Create Help Button dynamically
const helpBtn = document.createElement('button');
helpBtn.id = 'btn-help';
helpBtn.className = 'secondary-btn';
helpBtn.textContent = 'Help';
helpBtn.style.textAlign = 'center';
// Insert before download button
downloadBtn.parentElement.insertBefore(helpBtn, downloadBtn);


function init() {
  renderSidebar();
  renderGlobalSettings();
  selectGenerator(generators[0]);

  generateBtn.addEventListener('click', generateArt);
  downloadBtn.addEventListener('click', downloadSVG);
  helpBtn.addEventListener('click', showHelp);

  // Auto-resize
  window.addEventListener('resize', debounce(() => {
    generateArt();
  }, 500));
}

function showHelp() {
  const htmlContent = HelpSystem.getHelpContent(activeGenerator.getDisplayName());

  // Create Modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content';

  const header = document.createElement('div');
  header.className = 'modal-header';

  const title = document.createElement('h2');
  title.textContent = "Help: " + activeGenerator.getDisplayName();

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => document.body.removeChild(overlay);

  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'modal-body markdown-body';
  body.innerHTML = htmlContent;

  content.appendChild(header);
  content.appendChild(body);
  overlay.appendChild(content);

  // Close on click outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  document.body.appendChild(overlay);
}

function renderGlobalSettings() {
  const settingsDiv = document.createElement('div');
  settingsDiv.className = 'global-settings';
  settingsDiv.style.marginBottom = '20px';
  settingsDiv.style.paddingBottom = '10px';
  settingsDiv.style.borderBottom = '1px solid var(--border-color)';

  const label = document.createElement('label');
  label.textContent = "Paper Size";
  label.style.display = 'block';
  label.style.marginBottom = '5px';
  label.style.color = 'var(--text-secondary)';
  label.style.fontSize = '0.9rem';

  const select = document.createElement('select');
  select.style.width = '100%';
  select.style.padding = '0.5rem';
  select.style.backgroundColor = 'rgba(0,0,0,0.2)';
  select.style.border = '1px solid var(--border-color)';
  select.style.color = 'var(--text-primary)';
  select.style.borderRadius = '4px';

  for (const key in PaperSize) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = PaperSize[key].name;
    if (key === currentPaperSize) opt.selected = true;
    select.appendChild(opt);
  }

  select.addEventListener('change', (e) => {
    currentPaperSize = e.target.value;
    generateArt();
  });

  settingsDiv.appendChild(label);
  settingsDiv.appendChild(select);

  // Insert at top of controls
  // We'll append it to controlsContainer in selectGenerator or handle it separately?
  // Better to have a dedicated spot, but currently controlsContainer is cleared.
  // Let's modify renderControls to NOT clear everything, or call renderGlobalSettings inside renderControls.
}

function renderSidebar() {
  generatorListEl.innerHTML = '';
  generators.forEach(gen => {
    const item = document.createElement('div');
    item.className = 'generator-item';
    item.textContent = gen.getDisplayName();
    item.addEventListener('click', () => selectGenerator(gen));
    generatorListEl.appendChild(item);
  });
}

function selectGenerator(gen) {
  activeGenerator = gen;
  // Update active class
  Array.from(generatorListEl.children).forEach(child => {
    child.classList.toggle('active', child.textContent === gen.getDisplayName());
  });

  activeNameEl.textContent = gen.getDisplayName();

  // Initialize default params
  currentParams = {};
  gen.getParameterDefinitions().forEach(def => {
    currentParams[def.name] = def.defaultValue;
  });

  renderControls();

  // Initial generation
  generateArt();
}

function renderControls() {
  controlsContainer.innerHTML = '';

  // 1. Render Global Settings first
  renderGlobalSettingsInternal();

  // 2. Render Generator Params
  const params = activeGenerator.getParameterDefinitions();

  params.forEach(def => {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('label');
    label.textContent = def.name;
    if (def.description) {
      label.title = def.description; // Tooltip
      label.style.cursor = "help";
    }

    // Value Display (for text/bool, or just removing it in favor of inputs?)
    // Let's keep it for everything but update it differently
    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = "";
    label.appendChild(valueDisplay);

    group.appendChild(label);

    if (def.type === 'integer' || def.type === 'double') {
      const inputContainer = document.createElement('div');
      inputContainer.style.display = 'flex';
      inputContainer.style.alignItems = 'center';
      inputContainer.style.gap = '10px';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = def.min;
      slider.max = def.max;
      slider.step = def.type === 'double' ? 0.1 : 1;
      slider.value = def.defaultValue;
      slider.style.flex = '1';

      const numInput = document.createElement('input');
      numInput.type = 'number';
      numInput.min = def.min;
      numInput.max = def.max;
      numInput.step = def.type === 'double' ? 0.01 : 1; // finer control on number input
      numInput.value = def.defaultValue;
      numInput.style.width = '70px';
      numInput.style.backgroundColor = 'rgba(0,0,0,0.2)';
      numInput.style.border = '1px solid var(--border-color)';
      numInput.style.color = 'var(--text-primary)';
      numInput.style.padding = '4px';
      numInput.style.borderRadius = '4px';

      // Sync Slider -> Number
      slider.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        if (def.type === 'integer') val = parseInt(val);
        currentParams[def.name] = val;
        numInput.value = val;
      });

      // Sync Number -> Slider
      numInput.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (def.type === 'integer') val = parseInt(val);
        // Clamp
        if (val < def.min) val = def.min;
        if (val > def.max) val = def.max;

        currentParams[def.name] = val;
        slider.value = val;
        numInput.value = val;
      });

      inputContainer.appendChild(slider);
      inputContainer.appendChild(numInput);
      group.appendChild(inputContainer);

    } else if (def.type === 'string') {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = def.defaultValue;
      input.style.width = '100%';
      input.style.backgroundColor = 'rgba(0,0,0,0.2)';
      input.style.border = '1px solid var(--border-color)';
      input.style.color = 'var(--text-primary)';
      input.style.padding = '0.5rem';
      input.style.borderRadius = '0.25rem';

      input.addEventListener('change', (e) => {
        currentParams[def.name] = e.target.value;
      });
      group.appendChild(input);

    } else if (def.type === 'boolean') {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = def.defaultValue;
      input.style.width = '20px';
      input.style.height = '20px';
      input.style.cursor = 'pointer';

      input.addEventListener('change', (e) => {
        currentParams[def.name] = e.target.checked;
      });
      group.appendChild(input);

    } else if (def.type === 'selection') {
      const select = document.createElement('select');
      select.style.width = '100%';
      select.style.backgroundColor = 'rgba(0,0,0,0.2)';
      select.style.border = '1px solid var(--border-color)';
      select.style.color = 'var(--text-primary)';
      select.style.padding = '0.5rem';
      select.style.marginTop = '0.5rem';
      select.style.borderRadius = '0.25rem';
      select.style.cursor = 'pointer';

      def.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });
      select.value = def.defaultValue;

      select.addEventListener('change', (e) => {
        currentParams[def.name] = e.target.value;
      });

      group.appendChild(select);
    }

    controlsContainer.appendChild(group);
  });
}

function renderGlobalSettingsInternal() {
  const settingsDiv = document.createElement('div');
  settingsDiv.className = 'global-settings';
  settingsDiv.style.marginBottom = '20px';
  settingsDiv.style.paddingBottom = '10px';
  settingsDiv.style.borderBottom = '1px solid var(--border-color)';

  const label = document.createElement('label');
  label.textContent = "Paper Size";
  label.style.display = 'block';
  label.style.marginBottom = '5px';
  label.style.color = 'var(--text-secondary)';
  label.style.fontSize = '0.9rem';

  const select = document.createElement('select');
  select.style.width = '100%';
  select.style.padding = '0.5rem';
  select.style.backgroundColor = 'rgba(0,0,0,0.2)';
  select.style.border = '1px solid var(--border-color)';
  select.style.color = 'var(--text-primary)';
  select.style.borderRadius = '4px';

  for (const key in PaperSize) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = PaperSize[key].name;
    if (key === currentPaperSize) opt.selected = true;
    select.appendChild(opt);
  }

  select.addEventListener('change', (e) => {
    currentPaperSize = e.target.value;
    generateArt();
  });

  settingsDiv.appendChild(label);
  settingsDiv.appendChild(select);
  controlsContainer.appendChild(settingsDiv);
}

function generateArt() {
  // Get dimensions from Paper Settings
  const dims = getPaperDimensionsPx(currentPaperSize);

  // If "SCREEN", we might want to use container size, but PaperSize module has fixed size for now.
  // Actually, let's keep the logic: if PaperSize is SCREEN, use container? 
  // PaperSize.SCREEN_1000 is fixed 1000x1000.
  // Ideally, 'Responsive' mode would be nice.

  // Override params
  currentParams['width'] = dims.width;
  currentParams['height'] = dims.height;

  try {
    const output = activeGenerator.generate(currentParams);
    artOutput.innerHTML = output;

    // Adjust SVG ViewBox to ensure it fits or centers?
    // The Generators usually return SVG with width/height set in the string.
    // CSS handles the fitting in .art-output (contain/cover logic).
  } catch (e) {
    console.error("Generation failed", e);
    artOutput.innerHTML = `<div style="color:red">Error: ${e.message}</div>`;
  }
}

function downloadSVG() {
  const svgContent = artOutput.innerHTML;
  if (!svgContent) return;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${activeGenerator.getId()}-${Date.now()}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

init();
