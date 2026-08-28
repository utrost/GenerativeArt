import { PaperSize, getPaperDimensionsPx } from './core/PaperSize';
import { HelpSystem } from './core/HelpSystem';
import { buildSvgDiagnosticsViewModel } from './core/SvgDiagnostics.js';
import { isParameterDefinitionVisible } from './core/ParameterVisibility.js';
import { registerServiceWorker } from './registerServiceWorker.js';
import {
  CATEGORY_LABELS,
  createGeneratorInstances,
  filterGeneratorEntries,
  generatorRegistry,
  getFavoriteGeneratorIds,
  getRecentGeneratorIds,
  randomEntry,
  rememberRecentGeneratorId,
  toggleFavoriteGeneratorId,
} from './generators/generatorRegistry.js';

registerServiceWorker();

const generators = createGeneratorInstances();
const generatorsById = new Map(generators.map((generator) => [generator.getId(), generator]));
let generatorQuery = '';
let generatorCategory = 'All';

let activeGenerator = generators[0];
let currentParams = {};
let currentPaperSize = "A4_LANDSCAPE"; // Default
let hasGeneratedCurrentSelection = false;

const generatorListEl = document.getElementById('generator-list');
const activeNameEl = document.getElementById('active-generator-name');
const controlsContainer = document.getElementById('controls-container');
const artOutput = document.getElementById('art-output');
const generateBtn = document.getElementById('btn-generate');
const downloadBtn = document.getElementById('btn-download');
const svgDiagnosticsEl = document.getElementById('svg-diagnostics');
const generatorSearchEl = document.getElementById('generator-search');
const categoryFiltersEl = document.getElementById('generator-category-filters');
const recentEl = document.getElementById('generator-recent');
const favoritesEl = document.getElementById('generator-favorites');
const randomGeneratorBtn = document.getElementById('btn-random-generator');

// Create Help Button dynamically
const helpBtn = document.createElement('button');
helpBtn.id = 'btn-help';
helpBtn.className = 'secondary-btn';
helpBtn.textContent = 'Help';
helpBtn.style.textAlign = 'center';
// Insert before download button
downloadBtn.parentElement.insertBefore(helpBtn, downloadBtn);


function init() {
  setupMobileRedirectPrompt();
  renderSidebar();
  selectGenerator(generators[0]);

  generatorSearchEl.addEventListener('input', (event) => {
    generatorQuery = event.target.value;
    renderSidebar();
  });
  randomGeneratorBtn.addEventListener('click', selectRandomVisibleGenerator);
  generateBtn.addEventListener('click', generateArt);
  downloadBtn.addEventListener('click', downloadSVG);
  helpBtn.addEventListener('click', showHelp);

  // Auto-resize
  window.addEventListener('resize', debounce(scheduleGenerateArt, 500));
}

function setupMobileRedirectPrompt() {
  const banner = document.getElementById('mobile-redirect-banner');
  const stayDesktop = document.getElementById('btn-stay-desktop');
  const mobileQuery = window.matchMedia('(max-width: 720px)');
  const desktopPreferred = window.sessionStorage.getItem('genart:stayDesktop') === 'true';

  if (!banner || !stayDesktop || !mobileQuery.matches || desktopPreferred) return;

  const targetUrl = new URL('mobile.html', window.location.href);
  if (window.location.search.includes('mobile=1')) {
    window.location.href = targetUrl.href;
    return;
  }

  banner.hidden = false;
  stayDesktop.addEventListener('click', () => {
    window.sessionStorage.setItem('genart:stayDesktop', 'true');
    banner.hidden = true;
  });
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
    scheduleGenerateArt();
  });

  settingsDiv.appendChild(label);
  settingsDiv.appendChild(select);

  // Insert at top of controls
  // We'll append it to controlsContainer in selectGenerator or handle it separately?
  // Better to have a dedicated spot, but currently controlsContainer is cleared.
  // Let's modify renderControls to NOT clear everything, or call renderGlobalSettings inside renderControls.
}

function renderSidebar() {
  renderCategoryFilters();
  renderQuickSections();
  generatorListEl.innerHTML = '';
  const entries = getVisibleEntries();
  const grouped = new Map();
  for (const entry of entries) {
    if (!grouped.has(entry.category)) grouped.set(entry.category, []);
    grouped.get(entry.category).push(entry);
  }
  if (entries.length === 0) {
    generatorListEl.innerHTML = '<p class="empty-generator-list">No generator matches that filter.</p>';
    return;
  }
  for (const [category, categoryEntries] of grouped) {
    if (generatorCategory === 'All') {
      const heading = document.createElement('div');
      heading.className = 'generator-group-heading';
      heading.textContent = category;
      generatorListEl.appendChild(heading);
    }
    categoryEntries.forEach((entry) => generatorListEl.appendChild(createGeneratorCard(entry)));
  }
}

function renderCategoryFilters() {
  categoryFiltersEl.innerHTML = '';
  CATEGORY_LABELS.forEach((category) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'category-chip';
    chip.classList.toggle('active', category === generatorCategory);
    chip.textContent = category;
    chip.addEventListener('click', () => {
      generatorCategory = category;
      renderSidebar();
    });
    categoryFiltersEl.appendChild(chip);
  });
}

function renderQuickSections() {
  renderEntryPills(favoritesEl, 'Favorites', getFavoriteGeneratorIds());
  renderEntryPills(recentEl, 'Recent', getRecentGeneratorIds());
}

function renderEntryPills(container, label, ids) {
  container.innerHTML = '';
  const entries = ids.map((id) => generatorRegistry.find((entry) => entry.id === id)).filter(Boolean);
  if (entries.length === 0) return;
  const title = document.createElement('div');
  title.className = 'quick-section-title';
  title.textContent = label;
  container.appendChild(title);
  const row = document.createElement('div');
  row.className = 'quick-generator-row';
  entries.forEach((entry) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'quick-generator-pill';
    pill.textContent = entry.name;
    pill.addEventListener('click', () => selectGeneratorById(entry.id));
    row.appendChild(pill);
  });
  container.appendChild(row);
}

function createGeneratorCard(entry) {
  const item = document.createElement('article');
  item.className = 'generator-card generator-item';
  item.dataset.generatorId = entry.id;
  item.classList.toggle('active', activeGenerator?.getId() === entry.id);
  const favoriteIds = getFavoriteGeneratorIds();
  const star = document.createElement('button');
  star.type = 'button';
  star.className = 'favorite-toggle';
  star.textContent = favoriteIds.includes(entry.id) ? '★' : '☆';
  star.title = 'Toggle favorite';
  star.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleFavoriteGeneratorId(entry.id);
    renderSidebar();
  });
  const content = document.createElement('div');
  content.className = 'generator-card-content';
  content.innerHTML = `<strong>${entry.name}</strong><span>${entry.description}</span><small>${entry.tags.slice(0, 4).join(' · ')}</small>`;
  item.appendChild(content);
  item.appendChild(star);
  item.addEventListener('click', () => selectGeneratorById(entry.id));
  return item;
}

function getVisibleEntries() {
  return filterGeneratorEntries(generatorRegistry, { query: generatorQuery, category: generatorCategory });
}

function selectRandomVisibleGenerator() {
  const entry = randomEntry(getVisibleEntries());
  if (entry) selectGeneratorById(entry.id);
}

function selectGeneratorById(id) {
  const gen = generatorsById.get(id);
  if (gen) selectGenerator(gen);
}

function selectGenerator(gen) {
  activeGenerator = gen;
  rememberRecentGeneratorId(gen.getId());
  Array.from(generatorListEl.querySelectorAll('.generator-card')).forEach(child => {
    child.classList.toggle('active', child.dataset?.generatorId === gen.getId() || child.textContent.includes(gen.getDisplayName()));
  });
  renderQuickSections();

  activeNameEl.textContent = gen.getDisplayName();

  // Initialize default params
  currentParams = {};
  gen.getParameterDefinitions().forEach(def => {
    currentParams[def.name] = def.defaultValue;
  });

  renderControls();
  markGeneratorReady(gen);
}

let inputElements = {};
let isUpdatingUI = false;
let pendingGenerateTimer = null;
let pendingGenerateFrame = null;
let generationSequence = 0;

function renderControls() {
  controlsContainer.innerHTML = '';
  inputElements = {};

  // 1. Render Global Settings first
  renderGlobalSettingsInternal();

  // 2. Render Generator Params
  const params = activeGenerator.getParameterDefinitions();

  params.forEach(def => {
    if (!isDefinitionVisible(def, currentParams)) return;

    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('label');
    label.textContent = def.label || def.name;
    if (def.description) {
      label.title = def.description; // Tooltip
      label.style.cursor = "help";
    }

    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = "";
    label.appendChild(valueDisplay);
    group.appendChild(label);

    const handleParamChange = (val) => {
        if (isUpdatingUI) return;
        currentParams[def.name] = val;
        
        const needsRefresh = activeGenerator.onParameterChanged(def.name, val, currentParams);
        if (needsRefresh) {
            renderControls();
            scheduleGenerateArt();
        } else {
            scheduleGenerateArt();
        }
    };

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
      slider.value = currentParams[def.name];
      slider.style.flex = '1';

      const numInput = document.createElement('input');
      numInput.type = 'number';
      numInput.min = def.min;
      numInput.max = def.max;
      numInput.step = def.type === 'double' ? 0.01 : 1;
      numInput.value = currentParams[def.name];
      numInput.style.width = '70px';
      numInput.style.backgroundColor = 'rgba(0,0,0,0.2)';
      numInput.style.border = '1px solid var(--border-color)';
      numInput.style.color = 'var(--text-primary)';
      numInput.style.padding = '4px';
      numInput.style.borderRadius = '4px';

      slider.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        if (def.type === 'integer') val = parseInt(val);
        if (!isUpdatingUI) numInput.value = val;
        handleParamChange(val);
      });

      numInput.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (def.type === 'integer') val = parseInt(val);
        if (val < def.min) val = def.min;
        if (val > def.max) val = def.max;
        if (!isUpdatingUI) {
            slider.value = val;
            numInput.value = val;
        }
        handleParamChange(val);
      });

      inputElements[def.name] = { slider, numInput, type: def.type };
      inputContainer.appendChild(slider);
      inputContainer.appendChild(numInput);
      group.appendChild(inputContainer);

    } else if (def.type === 'string') {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentParams[def.name];
      input.style.width = '100%';
      input.style.backgroundColor = 'rgba(0,0,0,0.2)';
      input.style.border = '1px solid var(--border-color)';
      input.style.color = 'var(--text-primary)';
      input.style.padding = '0.5rem';
      input.style.borderRadius = '0.25rem';

      input.addEventListener('input', (e) => {
        handleParamChange(e.target.value);
      });
      
      inputElements[def.name] = { input, type: def.type };
      group.appendChild(input);

    } else if (def.type === 'boolean') {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = currentParams[def.name];
      input.style.width = '20px';
      input.style.height = '20px';
      input.style.cursor = 'pointer';

      input.addEventListener('change', (e) => {
        handleParamChange(e.target.checked);
      });
      
      inputElements[def.name] = { input, type: def.type };
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
      select.value = currentParams[def.name];

      select.addEventListener('change', (e) => {
        handleParamChange(e.target.value);
      });

      inputElements[def.name] = { input: select, type: def.type };
      group.appendChild(select);
    }

    controlsContainer.appendChild(group);
  });
}

function isDefinitionVisible(definition, params) {
  return isParameterDefinitionVisible(definition, params);
}

function updateControlsFromParams() {
    isUpdatingUI = true;
    try {
        for (const [paramName, elements] of Object.entries(inputElements)) {
            const val = currentParams[paramName];
            if (val === undefined) continue;

            if (elements.type === 'integer' || elements.type === 'double') {
                if (elements.slider.value != val) elements.slider.value = val;
                if (elements.numInput.value != val) elements.numInput.value = val;
            } else if (elements.type === 'string' || elements.type === 'selection') {
                if (elements.input.value !== val) elements.input.value = val;
            } else if (elements.type === 'boolean') {
                if (elements.input.checked !== val) elements.input.checked = val;
            }
        }
    } finally {
        isUpdatingUI = false;
        scheduleGenerateArt(); // Re-render the canvas with the new preset parameters
    }
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
    scheduleGenerateArt();
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
    updateSvgDiagnostics(output);
    hasGeneratedCurrentSelection = true;
    downloadBtn.disabled = false;

    // Adjust SVG ViewBox to ensure it fits or centers?
    // The Generators usually return SVG with width/height set in the string.
    // CSS handles the fitting in .art-output (contain/cover logic).
  } catch (e) {
    console.error("Generation failed", e);
    artOutput.innerHTML = `<div style="color:red">Error: ${e.message}</div>`;
    updateSvgDiagnostics(null);
    hasGeneratedCurrentSelection = false;
    downloadBtn.disabled = true;
  }
}

function markGeneratorReady(generator = activeGenerator) {
  generationSequence += 1;
  if (pendingGenerateTimer !== null) {
    clearTimeout(pendingGenerateTimer);
    pendingGenerateTimer = null;
  }
  if (pendingGenerateFrame !== null) {
    cancelAnimationFrame(pendingGenerateFrame);
    pendingGenerateFrame = null;
  }
  hasGeneratedCurrentSelection = false;
  artOutput.innerHTML = `
    <div class="empty-preview" role="status">
      <strong>${generator.getDisplayName()}</strong>
      <span>Adjust the controls, then press Generate to render the SVG.</span>
    </div>
  `;
  downloadBtn.disabled = true;
  if (svgDiagnosticsEl) {
    svgDiagnosticsEl.textContent = 'Ready — no SVG generated yet.';
    svgDiagnosticsEl.title = 'Generator selection is deferred until Generate is pressed.';
    svgDiagnosticsEl.dataset.status = 'empty';
  }
}

function scheduleGenerateArt(delay = 120) {
  generationSequence += 1;
  const sequence = generationSequence;

  if (!hasGeneratedCurrentSelection) {
    return;
  }

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

function updateSvgDiagnostics(svg) {
  if (!svgDiagnosticsEl) return;
  const viewModel = buildSvgDiagnosticsViewModel(svg);
  svgDiagnosticsEl.textContent = viewModel.text;
  svgDiagnosticsEl.title = viewModel.title;
  svgDiagnosticsEl.dataset.status = viewModel.status;
}

function downloadSVG() {
  const svg = artOutput.querySelector('svg');
  if (!svg) return;
  const svgContent = svg.outerHTML;

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
