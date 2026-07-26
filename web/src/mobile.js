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
import { PenroseTilingGenerator } from './generators/PenroseTilingGenerator';
import { WaveInterferenceGenerator } from './generators/WaveInterferenceGenerator';
import { ChladniPatternGenerator } from './generators/ChladniPatternGenerator';
import { CelticKnotGenerator } from './generators/CelticKnotGenerator';
import { ContourMapGenerator } from './generators/ContourMapGenerator';
import { CapsuleInterferenceGenerator } from './generators/CapsuleInterferenceGenerator';
import { FoldedCrystalGenerator } from './generators/FoldedCrystalGenerator';
import { CrumpledMeshGenerator } from './generators/CrumpledMeshGenerator';
import { PaperSize, getPaperDimensionsPx } from './core/PaperSize';
import { HelpSystem } from './core/HelpSystem';
import { registerServiceWorker } from './registerServiceWorker.js';

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
  new SpirographGenerator(),
  new PenroseTilingGenerator(),
  new WaveInterferenceGenerator(),
  new ChladniPatternGenerator(),
  new CelticKnotGenerator(),
  new ContourMapGenerator(),
  new CapsuleInterferenceGenerator(),
  new FoldedCrystalGenerator(),
  new CrumpledMeshGenerator(),
];

let activeGenerator = generators[0];
let currentParams = {};
let currentPaperSize = 'SCREEN_1000';
let inputElements = {};
let isUpdatingUI = false;

const generatorSelect = document.getElementById('mobile-generator-select');
const activeNameEl = document.getElementById('mobile-active-generator-name');
const controlsContainer = document.getElementById('mobile-controls-container');
const artOutput = document.getElementById('mobile-art-output');
const generateBtn = document.getElementById('btn-mobile-generate');
const controlsBtn = document.getElementById('btn-mobile-controls');
const closeControlsBtn = document.getElementById('btn-mobile-close-controls');
const controlsSheet = document.getElementById('mobile-controls-sheet');
const sheetBackdrop = document.getElementById('mobile-sheet-backdrop');
const downloadBtn = document.getElementById('btn-mobile-download');
const helpBtn = document.getElementById('btn-mobile-help');

function init() {
  renderGeneratorPicker();
  selectGenerator(generators[0]);

  generatorSelect.addEventListener('change', (event) => {
    const generator = generators.find((gen) => gen.getId() === event.target.value);
    if (generator) selectGenerator(generator);
  });

  generateBtn.addEventListener('click', generateArt);
  controlsBtn.addEventListener('click', openControls);
  closeControlsBtn.addEventListener('click', closeControls);
  sheetBackdrop.addEventListener('click', closeControls);
  downloadBtn.addEventListener('click', downloadSVG);
  helpBtn.addEventListener('click', showHelp);
  enableSheetDragToClose();

  window.addEventListener('resize', debounce(generateArt, 350));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeControls();
  });
}

function renderGeneratorPicker() {
  generatorSelect.innerHTML = '';
  generators.forEach((generator) => {
    const option = document.createElement('option');
    option.value = generator.getId();
    option.textContent = generator.getDisplayName();
    generatorSelect.appendChild(option);
  });
}

function selectGenerator(generator) {
  activeGenerator = generator;
  generatorSelect.value = generator.getId();
  activeNameEl.textContent = generator.getDisplayName();

  currentParams = {};
  generator.getParameterDefinitions().forEach((definition) => {
    currentParams[definition.name] = definition.defaultValue;
  });

  renderControls();
  generateArt();
}

function renderControls() {
  controlsContainer.innerHTML = '';
  inputElements = {};

  renderPaperSizeControl();

  activeGenerator.getParameterDefinitions().forEach((definition) => {
    if (!isDefinitionVisible(definition, currentParams)) return;

    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('label');
    label.textContent = definition.label || definition.name;
    if (definition.description) {
      label.title = definition.description;
    }

    const valueDisplay = document.createElement('span');
    label.appendChild(valueDisplay);
    group.appendChild(label);

    const handleParamChange = (value) => {
      if (isUpdatingUI) return;
      currentParams[definition.name] = value;
      valueDisplay.textContent = String(value);

      const needsRefresh = activeGenerator.onParameterChanged(definition.name, value, currentParams);
      if (needsRefresh) {
        renderControls();
        generateArt();
      } else {
        generateArt();
      }
    };

    if (definition.type === 'integer' || definition.type === 'double') {
      const inputRow = document.createElement('div');
      inputRow.className = 'mobile-input-row';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = definition.min;
      slider.max = definition.max;
      slider.step = definition.type === 'double' ? 0.1 : 1;
      slider.value = currentParams[definition.name];

      const numberInput = document.createElement('input');
      numberInput.type = 'number';
      numberInput.min = definition.min;
      numberInput.max = definition.max;
      numberInput.step = definition.type === 'double' ? 0.01 : 1;
      numberInput.value = currentParams[definition.name];

      valueDisplay.textContent = numberInput.value;

      slider.addEventListener('input', (event) => {
        const value = parseNumericValue(event.target.value, definition.type);
        numberInput.value = value;
        handleParamChange(value);
      });

      numberInput.addEventListener('change', (event) => {
        const value = clamp(parseNumericValue(event.target.value, definition.type), definition.min, definition.max);
        slider.value = value;
        numberInput.value = value;
        handleParamChange(value);
      });

      inputElements[definition.name] = { slider, numberInput, valueDisplay, type: definition.type };
      inputRow.appendChild(slider);
      inputRow.appendChild(numberInput);
      group.appendChild(inputRow);
    } else if (definition.type === 'selection') {
      const select = document.createElement('select');
      definition.options.forEach((optionValue) => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        select.appendChild(option);
      });
      select.value = currentParams[definition.name];
      valueDisplay.textContent = select.value;
      select.addEventListener('change', (event) => handleParamChange(event.target.value));
      inputElements[definition.name] = { input: select, valueDisplay, type: definition.type };
      group.appendChild(select);
    } else if (definition.type === 'boolean') {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(currentParams[definition.name]);
      valueDisplay.textContent = checkbox.checked ? 'on' : 'off';
      checkbox.addEventListener('change', (event) => handleParamChange(event.target.checked));
      inputElements[definition.name] = { input: checkbox, valueDisplay, type: definition.type };
      group.appendChild(checkbox);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentParams[definition.name];
      valueDisplay.textContent = input.value;
      input.addEventListener('input', (event) => handleParamChange(event.target.value));
      inputElements[definition.name] = { input, valueDisplay, type: definition.type };
      group.appendChild(input);
    }

    controlsContainer.appendChild(group);
  });
}

function isDefinitionVisible(definition, params) {
  if (!definition.appliesTo || definition.appliesTo.length === 0) return true;
  return definition.appliesTo.includes(params.constructionMode);
}

function renderPaperSizeControl() {
  const group = document.createElement('div');
  group.className = 'global-settings';

  const label = document.createElement('label');
  label.textContent = 'Paper Size';

  const select = document.createElement('select');
  Object.entries(PaperSize).forEach(([key, paperSize]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = paperSize.name;
    select.appendChild(option);
  });
  select.value = currentPaperSize;
  select.addEventListener('change', (event) => {
    currentPaperSize = event.target.value;
    generateArt();
  });

  group.appendChild(label);
  group.appendChild(select);
  controlsContainer.appendChild(group);
}

function updateControlsFromParams() {
  isUpdatingUI = true;
  try {
    Object.entries(inputElements).forEach(([paramName, elements]) => {
      const value = currentParams[paramName];
      if (value === undefined) return;

      if (elements.type === 'integer' || elements.type === 'double') {
        elements.slider.value = value;
        elements.numberInput.value = value;
      } else if (elements.type === 'boolean') {
        elements.input.checked = Boolean(value);
      } else {
        elements.input.value = value;
      }
      elements.valueDisplay.textContent = String(value);
    });
  } finally {
    isUpdatingUI = false;
  }
  generateArt();
}

function generateArt() {
  const dimensions = getPaperDimensionsPx(currentPaperSize);
  currentParams.width = dimensions.width;
  currentParams.height = dimensions.height;

  try {
    artOutput.innerHTML = activeGenerator.generate(currentParams);
  } catch (error) {
    console.error('Generation failed', error);
    artOutput.innerHTML = `<div class="mobile-error">Error: ${error.message}</div>`;
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
  URL.revokeObjectURL(url);
}

function openControls() {
  controlsSheet.classList.add('open');
  controlsBtn.classList.add('active');
  controlsSheet.setAttribute('aria-hidden', 'false');
  controlsBtn.setAttribute('aria-expanded', 'true');
  sheetBackdrop.hidden = false;
}

function closeControls() {
  controlsSheet.classList.remove('open', 'dragging');
  controlsBtn.classList.remove('active');
  controlsSheet.style.transform = '';
  controlsSheet.setAttribute('aria-hidden', 'true');
  controlsBtn.setAttribute('aria-expanded', 'false');
  sheetBackdrop.hidden = true;
}

function enableSheetDragToClose() {
  const handle = controlsSheet.querySelector('.sheet-handle');
  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  const startDrag = (event) => {
    if (!controlsSheet.classList.contains('open')) return;
    isDragging = true;
    startY = event.clientY;
    currentY = 0;
    controlsSheet.classList.add('dragging');
    handle.setPointerCapture(event.pointerId);
  };

  const updateDrag = (event) => {
    if (!isDragging) return;
    currentY = Math.max(0, event.clientY - startY);
    controlsSheet.style.transform = `translateY(${currentY}px)`;
  };

  const finishDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    controlsSheet.classList.remove('dragging');
    controlsSheet.style.transform = '';
    if (currentY > 96) closeControls();
  };

  handle.addEventListener('pointerdown', startDrag);
  handle.addEventListener('pointermove', updateDrag);
  handle.addEventListener('pointerup', finishDrag);
  handle.addEventListener('pointercancel', finishDrag);
}

function showHelp() {
  const overlay = document.createElement('div');
  overlay.className = 'mobile-help-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'mobile-help-dialog';

  const header = document.createElement('div');
  header.className = 'mobile-help-header';

  const title = document.createElement('h2');
  title.textContent = `Help: ${activeGenerator.getDisplayName()}`;

  const closeButton = document.createElement('button');
  closeButton.className = 'icon-btn';
  closeButton.setAttribute('aria-label', 'Close help');
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', () => overlay.remove());

  const body = document.createElement('div');
  body.className = 'mobile-help-body';
  body.innerHTML = HelpSystem.getHelpContent(activeGenerator.getDisplayName());

  header.appendChild(title);
  header.appendChild(closeButton);
  dialog.appendChild(header);
  dialog.appendChild(body);
  overlay.appendChild(dialog);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

function parseNumericValue(value, type) {
  const parsed = type === 'integer' ? parseInt(value, 10) : parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function debounce(callback, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), wait);
  };
}

init();
registerServiceWorker();
