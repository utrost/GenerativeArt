import { PaperSize, getPaperDimensionsPx } from './core/PaperSize';
import { HelpSystem } from './core/HelpSystem';
import { registerServiceWorker } from './registerServiceWorker.js';
import {
  CATEGORY_LABELS,
  createGeneratorInstances,
  filterGeneratorEntries,
  generatorRegistry,
  getFavoriteGeneratorIds,
  getRecentGeneratorIds,
  rememberRecentGeneratorId,
  toggleFavoriteGeneratorId,
} from './generators/generatorRegistry.js';

const generators = createGeneratorInstances();
const generatorsById = new Map(generators.map((generator) => [generator.getId(), generator]));
let generatorQuery = '';
let generatorCategory = 'All';

let activeGenerator = generators[0];
let currentParams = {};
let currentPaperSize = 'SCREEN_1000';
let inputElements = {};
let isUpdatingUI = false;
let pendingGenerateTimer = null;
let pendingGenerateFrame = null;
let generationSequence = 0;

const MOBILE_GENERATION_DELAY_MS = 120;

const generatorPickerBtn = document.getElementById('btn-mobile-generator-picker');
const generatorLabel = document.getElementById('mobile-current-generator-label');
const closeGeneratorPickerBtn = document.getElementById('btn-mobile-close-generator-picker');
const generatorSheet = document.getElementById('mobile-generator-sheet');
const generatorSearch = document.getElementById('mobile-generator-search');
const generatorCategoryFilters = document.getElementById('mobile-generator-category-filters');
const generatorQuick = document.getElementById('mobile-generator-quick');
const generatorList = document.getElementById('mobile-generator-list');
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

  generatorPickerBtn.addEventListener('click', openGeneratorPicker);
  closeGeneratorPickerBtn.addEventListener('click', closeGeneratorPicker);
  generatorSearch.addEventListener('input', (event) => {
    generatorQuery = event.target.value;
    renderGeneratorPicker();
  });

  generateBtn.addEventListener('click', generateArt);
  controlsBtn.addEventListener('click', openControls);
  closeControlsBtn.addEventListener('click', closeControls);
  sheetBackdrop.addEventListener('click', () => { closeControls(); closeGeneratorPicker(); });
  downloadBtn.addEventListener('click', downloadSVG);
  helpBtn.addEventListener('click', showHelp);
  enableSheetDragToClose();

  window.addEventListener('resize', debounce(generateArt, 350));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeControls(); closeGeneratorPicker(); }
  });
}

function renderGeneratorPicker() {
  generatorCategoryFilters.innerHTML = '';
  CATEGORY_LABELS.forEach((category) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'category-chip';
    chip.classList.toggle('active', category === generatorCategory);
    chip.textContent = category;
    chip.addEventListener('click', () => { generatorCategory = category; renderGeneratorPicker(); });
    generatorCategoryFilters.appendChild(chip);
  });

  generatorQuick.innerHTML = '';
  renderMobileQuick('Favorites', getFavoriteGeneratorIds());
  renderMobileQuick('Recent', getRecentGeneratorIds());

  generatorList.innerHTML = '';
  const entries = filterGeneratorEntries(generatorRegistry, { query: generatorQuery, category: generatorCategory });
  entries.forEach((entry) => generatorList.appendChild(createMobileGeneratorCard(entry)));
  if (!entries.length) generatorList.innerHTML = '<p class="empty-generator-list">No generator matches that filter.</p>';
}

function selectGenerator(generator) {
  activeGenerator = generator;
  generatorLabel.textContent = generator.getDisplayName();
  activeNameEl.textContent = generator.getDisplayName();
  rememberRecentGeneratorId(generator.getId());

  currentParams = {};
  generator.getParameterDefinitions().forEach((definition) => {
    currentParams[definition.name] = definition.defaultValue;
  });

  renderControls();
  renderGeneratorPicker();
  generateArt();
}

function createMobileGeneratorCard(entry) {
  const card = document.createElement('article');
  card.className = 'mobile-generator-card';
  card.classList.toggle('active', activeGenerator?.getId() === entry.id);
  card.innerHTML = `<div><strong>${entry.name}</strong><span>${entry.description}</span><small>${entry.category} · ${entry.tags.slice(0, 3).join(' · ')}</small></div>`;
  const star = document.createElement('button');
  star.type = 'button';
  star.className = 'favorite-toggle';
  star.textContent = getFavoriteGeneratorIds().includes(entry.id) ? '★' : '☆';
  star.addEventListener('click', (event) => { event.stopPropagation(); toggleFavoriteGeneratorId(entry.id); renderGeneratorPicker(); });
  card.appendChild(star);
  card.addEventListener('click', () => {
    const generator = generatorsById.get(entry.id);
    if (generator) selectGenerator(generator);
    closeGeneratorPicker();
  });
  return card;
}

function renderMobileQuick(label, ids) {
  const entries = ids.map((id) => generatorRegistry.find((entry) => entry.id === id)).filter(Boolean);
  if (!entries.length) return;
  const title = document.createElement('div');
  title.className = 'quick-section-title';
  title.textContent = label;
  generatorQuick.appendChild(title);
  const row = document.createElement('div');
  row.className = 'quick-generator-row';
  entries.forEach((entry) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'quick-generator-pill';
    pill.textContent = entry.name;
    pill.addEventListener('click', () => {
      const generator = generatorsById.get(entry.id);
      if (generator) selectGenerator(generator);
      closeGeneratorPicker();
    });
    row.appendChild(pill);
  });
  generatorQuick.appendChild(row);
}

function openGeneratorPicker() {
  closeControls();
  generatorSheet.classList.add('open');
  generatorSheet.setAttribute('aria-hidden', 'false');
  generatorPickerBtn.setAttribute('aria-expanded', 'true');
  sheetBackdrop.hidden = false;
  setTimeout(() => generatorSearch.focus(), 60);
}

function closeGeneratorPicker() {
  generatorSheet.classList.remove('open');
  generatorSheet.setAttribute('aria-hidden', 'true');
  generatorPickerBtn.setAttribute('aria-expanded', 'false');
  if (!controlsSheet.classList.contains('open')) sheetBackdrop.hidden = true;
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
      }
      scheduleGenerateArt();
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
    scheduleGenerateArt();
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
  scheduleGenerateArt();
}

function scheduleGenerateArt(delay = MOBILE_GENERATION_DELAY_MS) {
  generationSequence += 1;
  const sequence = generationSequence;

  if (pendingGenerateTimer !== null) {
    clearTimeout(pendingGenerateTimer);
  }
  if (pendingGenerateFrame !== null) {
    cancelAnimationFrame(pendingGenerateFrame);
    pendingGenerateFrame = null;
  }

  pendingGenerateTimer = window.setTimeout(() => {
    pendingGenerateTimer = null;
    pendingGenerateFrame = requestAnimationFrame(() => {
      pendingGenerateFrame = null;
      if (sequence === generationSequence) generateArt();
    });
  }, delay);
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
  closeGeneratorPicker();
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
