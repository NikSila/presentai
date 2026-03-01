import * as state from './state.js';
import * as api from './api.js';
import { renderSlideHtml, hydrateCharts } from './renderer.js';
import { destroyAll as destroyAllCharts } from './charts.js';

const $ = (id) => document.getElementById(id);

const LAYOUT_META = [
  { layout: 'title',      label: 'Title',      icon: 'T' },
  { layout: 'section',    label: 'Section',     icon: 'S' },
  { layout: 'content',    label: 'Content',     icon: '\u2261' },
  { layout: 'two_column', label: 'Two Column',  icon: '\u2016' },
  { layout: 'big_number', label: 'Big Number',  icon: '#' },
  { layout: 'quote',      label: 'Quote',       icon: '\u201C' },
  { layout: 'conclusion', label: 'Conclusion',  icon: '\u2713' },
  { layout: 'thank_you',  label: 'Thank You',   icon: '\u2665' },
  { layout: 'chart_bar',  label: 'Bar Chart',   icon: '\u2587' },
  { layout: 'chart_pie',  label: 'Pie Chart',   icon: '\u25D4' },
  { layout: 'chart_line', label: 'Line Chart',  icon: '\u2571' },
  { layout: 'table',      label: 'Table',       icon: '\u2637' },
  { layout: 'timeline',   label: 'Timeline',    icon: '\u2192' },
];

let selectedFiles = [];
let dragFromIdx = null;

// ─── Provider switch ────────────────────────────────────────────────────

function initProviderSwitch() {
  api.getHealth().then((h) => {
    updateProviderUI(h.provider, h.model);
  }).catch(() => {});

  $('providerSwitch').addEventListener('click', async (e) => {
    const btn = e.target.closest('.provider-btn');
    if (!btn) return;
    const provider = btn.dataset.provider;
    try {
      const result = await api.setProvider(provider);
      updateProviderUI(result.provider, result.model);
    } catch (err) {
      setStatus('setup', err.message, 'error');
    }
  });
}

function updateProviderUI(provider, model) {
  $('providerSwitch').querySelectorAll('.provider-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.provider === provider);
  });
  $('providerModel').textContent = model || '';
}

// ─── Setup view wiring ──────────────────────────────────────────────────

function initSetup() {
  const uploadZone = $('uploadZone');
  const fileInput = $('fileInput');
  const uploadBtn = $('uploadBtn');
  const analyzeImagesBtn = $('analyzeImagesBtn');
  const analyzeUrlBtn = $('analyzeUrlBtn');
  const urlInput = $('urlInput');
  const generateBtn = $('generateBtn');
  const brandPreview = $('brandPreview');
  const uploadedFiles = $('uploadedFiles');

  uploadBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
  uploadZone.addEventListener('click', () => fileInput.click());

  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragging'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragging'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragging');
    const files = [...e.dataTransfer.files].filter((f) => /\.(png|jpe?g|webp)$/i.test(f.name));
    if (files.length) setFiles(files);
  });

  fileInput.addEventListener('change', () => {
    const files = [...(fileInput.files || [])];
    if (files.length) setFiles(files);
  });

  function setFiles(files) {
    selectedFiles = files;
    uploadedFiles.innerHTML = '';
    files.forEach((f) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      img.className = 'file-thumb';
      img.alt = f.name;
      uploadedFiles.appendChild(img);
    });
    analyzeImagesBtn.style.display = files.length ? '' : 'none';
  }

  analyzeImagesBtn.addEventListener('click', async () => {
    if (!selectedFiles.length) return;
    setStatus('setup', 'Analyzing brand images\u2026', 'loading');
    analyzeImagesBtn.disabled = true;
    try {
      const brand = await api.analyzeBrandImages(selectedFiles);
      state.update({ brand });
      renderBrandPreview(brand);
      setStatus('setup', 'Brand style extracted.', 'success');
    } catch (e) {
      setStatus('setup', e.message, 'error');
    } finally {
      analyzeImagesBtn.disabled = false;
    }
  });

  analyzeUrlBtn.addEventListener('click', async () => {
    const url = (urlInput.value || '').trim();
    if (!url) { setStatus('setup', 'Enter a URL first.', 'error'); return; }
    setStatus('setup', 'Analyzing URL\u2026', 'loading');
    analyzeUrlBtn.disabled = true;
    try {
      const brand = await api.analyzeBrandUrl(url);
      state.update({ brand });
      renderBrandPreview(brand);
      setStatus('setup', 'Brand style extracted from URL.', 'success');
    } catch (e) {
      setStatus('setup', e.message, 'error');
    } finally {
      analyzeUrlBtn.disabled = false;
    }
  });

  generateBtn.addEventListener('click', async () => {
    const topic = ($('topicInput').value || '').trim();
    if (!topic) { setStatus('setup', 'Enter a presentation topic.', 'error'); return; }
    const instructions = ($('instructionsInput').value || '').trim();
    const { brand } = state.getState();
    setStatus('setup', 'Generating presentation\u2026 This may take 20\u201340 seconds.', 'loading');
    generateBtn.disabled = true;
    try {
      const slides = await api.generateSlides(topic, instructions, brand);
      state.update({ topic });
      state.setSlides(slides);
      showEditor();
    } catch (e) {
      setStatus('setup', e.message, 'error');
    } finally {
      generateBtn.disabled = false;
    }
  });
}

function renderBrandPreview(brand) {
  const el = $('brandPreview');
  if (!brand) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');

  const allColors = [
    { hex: brand.colors.primary, label: 'Primary' },
    { hex: brand.colors.secondary, label: 'Secondary' },
    { hex: brand.colors.accent, label: 'Accent' },
    { hex: brand.colors.background, label: 'Background' },
    { hex: brand.colors.text, label: 'Text' },
    ...(brand.colors.additional || []).map((h, i) => ({ hex: h, label: `Extra ${i + 1}` })),
  ];

  const swatches = allColors.map((c) =>
    `<div class="swatch" style="background:${c.hex}" title="${c.label}"><span class="swatch-label">${c.label}</span></div>`
  ).join('');

  const tags = (brand.brand.personality || []).map((t) => `<span class="brand-tag">${t}</span>`).join('');

  el.innerHTML = `
    <div class="brand-preview-header">Brand Palette</div>
    <div class="brand-palette">${swatches}</div>
    ${tags ? `<div class="brand-tags">${tags}</div>` : ''}
    <div class="brand-info-row"><strong>Name:</strong> ${brand.brand.name || '\u2014'} &middot; <strong>Industry:</strong> ${brand.brand.industry || '\u2014'}</div>
    <div class="brand-info-row"><strong>Tone:</strong> ${brand.brand.tone || '\u2014'} &middot; <strong>Style:</strong> ${brand.brand.visualStyle || '\u2014'}</div>
    ${brand.presentation.designNotes ? `<div class="brand-notes">${brand.presentation.designNotes}</div>` : ''}
  `;
}

// ─── Editor view wiring ─────────────────────────────────────────────────

function initEditor() {
  $('addSlideBtn').addEventListener('click', openAddModal);
  $('duplicateSlideBtn').addEventListener('click', () => {
    const { currentIndex } = state.getState();
    if (currentIndex >= 0) state.duplicateSlide(currentIndex);
  });
  $('deleteSlideBtn').addEventListener('click', () => {
    const { currentIndex } = state.getState();
    if (currentIndex >= 0) state.deleteSlide(currentIndex);
  });
  $('backToSetup').addEventListener('click', showSetup);
  $('exportBtn').addEventListener('click', async () => {
    const { slides, brand } = state.getState();
    if (!slides.length) return;
    setStatus('editor', 'Exporting PPTX\u2026', 'loading');
    $('exportBtn').disabled = true;
    try {
      await api.exportPptx(slides, brand);
      setStatus('editor', 'Exported!', 'success');
      setTimeout(() => setStatus('editor', '', ''), 2000);
    } catch (e) {
      setStatus('editor', e.message, 'error');
    } finally {
      $('exportBtn').disabled = false;
    }
  });

  $('cancelAddSlide').addEventListener('click', closeAddModal);
  $('addSlideModal').addEventListener('click', (e) => {
    if (e.target === $('addSlideModal')) closeAddModal();
  });

  populateLayoutGrid();
}

function populateLayoutGrid() {
  const grid = $('layoutGrid');
  grid.innerHTML = LAYOUT_META.map((m) => `
    <div class="layout-option" data-layout="${m.layout}">
      <svg width="28" height="28" viewBox="0 0 28 28"><text x="14" y="20" text-anchor="middle" font-size="20" fill="currentColor">${m.icon}</text></svg>
      <span>${m.label}</span>
    </div>
  `).join('');
  grid.addEventListener('click', (e) => {
    const opt = e.target.closest('.layout-option');
    if (!opt) return;
    const { currentIndex } = state.getState();
    state.addSlide(opt.dataset.layout, currentIndex);
    closeAddModal();
  });
}

function openAddModal() { $('addSlideModal').classList.remove('hidden'); }
function closeAddModal() { $('addSlideModal').classList.add('hidden'); }

// ─── Rendering ──────────────────────────────────────────────────────────

export function render() {
  const { slides, currentIndex, brand } = state.getState();
  renderSlidePanel(slides, currentIndex, brand);
  renderCanvas(slides, currentIndex, brand);
  renderPropsPanel(slides, currentIndex);
  $('slideCount').textContent = slides.length;
  $('presTitle').textContent = state.getState().topic || 'Presentation';
}

function renderSlidePanel(slides, currentIndex, brand) {
  const list = $('slideList');
  const total = slides.length;

  const thumbWidth = 168;
  const scale = thumbWidth / 960;

  list.innerHTML = slides.map((s, i) => {
    const html = renderSlideHtml(s, brand, i, total);
    return `<div class="slide-thumb-item${i === currentIndex ? ' active' : ''}" data-idx="${i}" draggable="true">
      <div class="slide-thumb-wrap" style="height:${Math.round(540 * scale)}px">
        <div style="transform:scale(${scale});width:960px;height:540px;transform-origin:top left;pointer-events:none">${html}</div>
      </div>
      <span class="slide-thumb-num">${i + 1}</span>
    </div>`;
  }).join('');

  list.querySelectorAll('.slide-thumb-item').forEach((el) => {
    const idx = parseInt(el.dataset.idx);
    el.addEventListener('click', () => state.selectSlide(idx));
    el.addEventListener('dragstart', (e) => {
      dragFromIdx = idx;
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); dragFromIdx = null; });
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drag-over');
      if (dragFromIdx != null && dragFromIdx !== idx) state.moveSlide(dragFromIdx, idx);
      dragFromIdx = null;
    });
  });

  // Charts are only hydrated on the main canvas, not thumbnails (too small).
}

function renderCanvas(slides, currentIndex, brand) {
  const canvas = $('slideCanvas');
  destroyAllCharts();
  if (currentIndex < 0 || currentIndex >= slides.length) {
    canvas.innerHTML = '<p style="color:#666;text-align:center;margin-top:200px">No slide selected</p>';
    return;
  }
  const slide = slides[currentIndex];
  canvas.innerHTML = renderSlideHtml(slide, brand, currentIndex, slides.length);
  hydrateCharts(canvas, slide, brand);
}

// ─── Properties panel ───────────────────────────────────────────────────

function renderPropsPanel(slides, currentIndex) {
  const body = $('propsBody');
  if (currentIndex < 0 || currentIndex >= slides.length) {
    body.innerHTML = '<p class="props-hint">Select a slide to edit its content</p>';
    return;
  }
  const slide = slides[currentIndex];
  const layout = slide.layout;
  let html = layoutSelector(layout);

  switch (layout) {
    case 'title':
      html += textField('title', 'Title', slide.title);
      html += textField('subtitle', 'Subtitle', slide.subtitle);
      break;
    case 'section':
      html += textField('title', 'Title', slide.title);
      break;
    case 'content':
      html += textField('title', 'Title', slide.title);
      html += listField('items', 'Items', slide.items);
      break;
    case 'two_column':
      html += textField('title', 'Title', slide.title);
      html += listField('left', 'Left Column', slide.left);
      html += listField('right', 'Right Column', slide.right);
      break;
    case 'big_number':
      html += textField('number', 'Number', slide.number);
      html += textField('label', 'Label', slide.label);
      html += textField('description', 'Description', slide.description);
      break;
    case 'quote':
      html += areaField('quote', 'Quote', slide.quote);
      html += textField('author', 'Author', slide.author);
      break;
    case 'conclusion':
      html += textField('title', 'Title', slide.title);
      html += listField('items', 'Items', slide.items);
      break;
    case 'thank_you':
      html += textField('title', 'Title', slide.title);
      html += textField('subtitle', 'Subtitle', slide.subtitle);
      break;
    case 'chart_bar':
    case 'chart_line':
      html += textField('title', 'Title', slide.title);
      html += textField('description', 'Description', slide.description || '');
      html += chartSeriesFields(slide.chartData);
      break;
    case 'chart_pie':
      html += textField('title', 'Title', slide.title);
      html += textField('description', 'Description', slide.description || '');
      html += chartPieFields(slide.chartData);
      break;
    case 'table':
      html += textField('title', 'Title', slide.title);
      html += tableFields(slide);
      break;
    case 'timeline':
      html += textField('title', 'Title', slide.title);
      html += timelineFields(slide.events);
      break;
    default:
      html += textField('title', 'Title', slide.title || '');
  }

  body.innerHTML = html;
  wirePropsEvents(body, currentIndex);
}

function layoutSelector(current) {
  const options = LAYOUT_META.map((m) =>
    `<option value="${m.layout}"${m.layout === current ? ' selected' : ''}>${m.label}</option>`
  ).join('');
  return `<div class="layout-select-row">
    <label class="prop-label">Layout</label>
    <select class="prop-select" data-action="changeLayout">${options}</select>
  </div>`;
}

function textField(key, label, value) {
  return `<div class="prop-group">
    <label class="prop-label">${label}</label>
    <input class="prop-input" data-field="${key}" value="${esc(value || '')}"/>
  </div>`;
}

function areaField(key, label, value) {
  return `<div class="prop-group">
    <label class="prop-label">${label}</label>
    <textarea class="prop-input" data-field="${key}" rows="3">${esc(value || '')}</textarea>
  </div>`;
}

function listField(key, label, items) {
  const rows = (items || []).map((it, i) =>
    `<div class="prop-list-item">
      <input class="prop-input" data-list="${key}" data-list-idx="${i}" value="${esc(it)}"/>
      <button class="remove-btn" data-remove-list="${key}" data-remove-idx="${i}">&times;</button>
    </div>`
  ).join('');
  return `<div class="prop-group">
    <label class="prop-label">${label}</label>
    <div class="prop-list">${rows}</div>
    <button class="add-item-btn" data-add-list="${key}">+ Add item</button>
  </div>`;
}

function chartSeriesFields(chartData) {
  if (!chartData) return '';
  let html = '<div class="prop-group"><label class="prop-label">Labels (comma-separated)</label>';
  html += `<input class="prop-input" data-field="chartLabels" value="${esc((chartData.labels || []).join(', '))}"/>`;
  html += '</div>';
  (chartData.series || []).forEach((s, si) => {
    html += `<div class="prop-group"><label class="prop-label">Series: ${esc(s.name)}</label>`;
    html += `<input class="prop-input" data-field="seriesName" data-series-idx="${si}" value="${esc(s.name)}"/>`;
    html += `<input class="prop-input" data-field="seriesData" data-series-idx="${si}" value="${esc((s.data || []).join(', '))}"/>`;
    html += '</div>';
  });
  return html;
}

function chartPieFields(chartData) {
  if (!chartData) return '';
  let html = '<div class="prop-group"><label class="prop-label">Labels (comma-separated)</label>';
  html += `<input class="prop-input" data-field="chartLabels" value="${esc((chartData.labels || []).join(', '))}"/>`;
  html += '</div>';
  html += '<div class="prop-group"><label class="prop-label">Values (comma-separated)</label>';
  html += `<input class="prop-input" data-field="chartValues" value="${esc((chartData.values || []).join(', '))}"/>`;
  html += '</div>';
  return html;
}

function tableFields(slide) {
  let html = '<div class="prop-group"><label class="prop-label">Headers (comma-separated)</label>';
  html += `<input class="prop-input" data-field="tableHeaders" value="${esc((slide.headers || []).join(', '))}"/>`;
  html += '</div>';
  (slide.rows || []).forEach((row, ri) => {
    html += `<div class="prop-list-item">
      <input class="prop-input" data-field="tableRow" data-row-idx="${ri}" value="${esc(row.join(', '))}"/>
      <button class="remove-btn" data-remove-row="${ri}">&times;</button>
    </div>`;
  });
  html += `<button class="add-item-btn" data-add-table-row>+ Add row</button>`;
  return html;
}

function timelineFields(events) {
  let html = '';
  (events || []).forEach((ev, i) => {
    html += `<div class="prop-group" style="border-top:1px solid var(--border);padding-top:10px">
      <label class="prop-label">Event ${i + 1}</label>
      <input class="prop-input" data-event-idx="${i}" data-event-field="date" value="${esc(ev.date)}" placeholder="Date"/>
      <input class="prop-input" data-event-idx="${i}" data-event-field="title" value="${esc(ev.title)}" placeholder="Title"/>
      <input class="prop-input" data-event-idx="${i}" data-event-field="description" value="${esc(ev.description || '')}" placeholder="Description"/>
      <button class="remove-btn" data-remove-event="${i}" style="align-self:flex-end">&times;</button>
    </div>`;
  });
  html += `<button class="add-item-btn" data-add-event>+ Add event</button>`;
  return html;
}

function esc(str) {
  return (str ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wirePropsEvents(body, idx) {
  const { slides } = state.getState();
  const slide = slides[idx];
  if (!slide) return;

  body.querySelector('[data-action="changeLayout"]')?.addEventListener('change', (e) => {
    const newLayout = e.target.value;
    const defaults = state.LAYOUT_DEFAULTS[newLayout] || {};
    const merged = { ...defaults, ...slide, layout: newLayout };
    state.updateSlide(idx, merged);
  });

  body.querySelectorAll('[data-field]').forEach((input) => {
    const handler = () => {
      const field = input.dataset.field;
      if (field === 'chartLabels') {
        const labels = input.value.split(',').map((s) => s.trim()).filter(Boolean);
        const cd = { ...(slide.chartData || {}) };
        cd.labels = labels;
        state.updateSlide(idx, { chartData: cd });
      } else if (field === 'chartValues') {
        const vals = input.value.split(',').map((s) => parseFloat(s.trim())).filter((v) => !isNaN(v));
        const cd = { ...(slide.chartData || {}) };
        cd.values = vals;
        state.updateSlide(idx, { chartData: cd });
      } else if (field === 'seriesName') {
        const si = parseInt(input.dataset.seriesIdx);
        const cd = structuredClone(slide.chartData || {});
        if (cd.series?.[si]) cd.series[si].name = input.value;
        state.updateSlide(idx, { chartData: cd });
      } else if (field === 'seriesData') {
        const si = parseInt(input.dataset.seriesIdx);
        const cd = structuredClone(slide.chartData || {});
        if (cd.series?.[si]) cd.series[si].data = input.value.split(',').map((s) => parseFloat(s.trim())).filter((v) => !isNaN(v));
        state.updateSlide(idx, { chartData: cd });
      } else if (field === 'tableHeaders') {
        state.updateSlide(idx, { headers: input.value.split(',').map((s) => s.trim()) });
      } else if (field === 'tableRow') {
        const ri = parseInt(input.dataset.rowIdx);
        const rows = structuredClone(slide.rows || []);
        rows[ri] = input.value.split(',').map((s) => s.trim());
        state.updateSlide(idx, { rows });
      } else {
        state.updateSlide(idx, { [field]: input.value });
      }
    };
    input.addEventListener('input', debounce(handler, 300));
  });

  body.querySelectorAll('[data-list]').forEach((input) => {
    input.addEventListener('input', debounce(() => {
      const key = input.dataset.list;
      const li = parseInt(input.dataset.listIdx);
      const arr = [...(slide[key] || [])];
      arr[li] = input.value;
      state.updateSlide(idx, { [key]: arr });
    }, 300));
  });

  body.querySelectorAll('[data-remove-list]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.removeList;
      const ri = parseInt(btn.dataset.removeIdx);
      const arr = [...(slide[key] || [])];
      arr.splice(ri, 1);
      state.updateSlide(idx, { [key]: arr });
    });
  });

  body.querySelectorAll('[data-add-list]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.addList;
      const arr = [...(slide[key] || []), ''];
      state.updateSlide(idx, { [key]: arr });
    });
  });

  body.querySelectorAll('[data-event-field]').forEach((input) => {
    input.addEventListener('input', debounce(() => {
      const ei = parseInt(input.dataset.eventIdx);
      const field = input.dataset.eventField;
      const events = structuredClone(slide.events || []);
      if (events[ei]) events[ei][field] = input.value;
      state.updateSlide(idx, { events });
    }, 300));
  });

  body.querySelectorAll('[data-remove-event]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ei = parseInt(btn.dataset.removeEvent);
      const events = structuredClone(slide.events || []);
      events.splice(ei, 1);
      state.updateSlide(idx, { events });
    });
  });

  body.querySelector('[data-add-event]')?.addEventListener('click', () => {
    const events = structuredClone(slide.events || []);
    events.push({ date: '', title: '', description: '' });
    state.updateSlide(idx, { events });
  });

  body.querySelectorAll('[data-remove-row]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ri = parseInt(btn.dataset.removeRow);
      const rows = structuredClone(slide.rows || []);
      rows.splice(ri, 1);
      state.updateSlide(idx, { rows });
    });
  });

  body.querySelector('[data-add-table-row]')?.addEventListener('click', () => {
    const rows = structuredClone(slide.rows || []);
    const cols = (slide.headers || []).length || 3;
    rows.push(Array(cols).fill(''));
    state.updateSlide(idx, { rows });
  });
}

// ─── View switching ─────────────────────────────────────────────────────

function showEditor() {
  $('setupView').classList.add('hidden');
  $('editorView').classList.remove('hidden');
  render();
}

function showSetup() {
  $('editorView').classList.add('hidden');
  $('setupView').classList.remove('hidden');
}

// ─── Status messages ────────────────────────────────────────────────────

function setStatus(view, msg, type) {
  const el = view === 'setup' ? $('setupStatus') : $('editorStatus');
  if (!msg) { el.classList.add('hidden'); el.textContent = ''; el.className = el.className.replace(/loading|error|success/g, '').trim(); return; }
  el.textContent = msg;
  el.classList.remove('hidden', 'loading', 'error', 'success');
  if (type) el.classList.add(type);
  if (type === 'success') setTimeout(() => setStatus(view, '', ''), 3000);
}

// ─── Utility ────────────────────────────────────────────────────────────

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ─── Public init ────────────────────────────────────────────────────────

export function init() {
  initProviderSwitch();
  initSetup();
  initEditor();
  state.subscribe(() => {
    if (!$('editorView').classList.contains('hidden')) render();
  });
}
