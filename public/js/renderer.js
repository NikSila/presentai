import { renderBarChart, renderPieChart, renderLineChart } from './charts.js';

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

function textColorOn(hex) {
  const h = (hex || '#888888').replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#1a1a2e' : '#ffffff';
}

function headerHtml(title, brand) {
  const bg = brand.colors.primary;
  const fg = textColorOn(bg);
  const accent = brand.colors.accent;
  return `<div class="s-header" style="background:${esc(bg)}">
    <span class="s-header-title" style="color:${esc(fg)}">${esc(title)}</span>
    <div class="s-header-accent" style="background:${esc(accent)}"></div>
  </div>`;
}

function footerHtml(idx, total, brand) {
  return `<div class="s-footer" style="background:${esc(brand.colors.primary)}">
    <span>${idx + 1} / ${total}</span>
  </div>`;
}

const layouts = {

  title(s, brand) {
    const bg = brand.colors.primary;
    const fg = textColorOn(bg);
    const accent = brand.colors.accent;
    return `<div class="slide-render s-title-layout" style="background:${esc(bg)};color:${esc(fg)}">
      <div class="s-title-deco" style="background:${esc(accent)}"></div>
      <div class="s-title-text">${esc(s.title)}</div>
      <div class="s-accent-line" style="background:${esc(accent)}"></div>
      <div class="s-subtitle-text" style="color:${esc(accent)}">${esc(s.subtitle)}</div>
    </div>`;
  },

  section(s, brand) {
    const bg = brand.colors.accent;
    const fg = textColorOn(bg);
    const primary = brand.colors.primary;
    return `<div class="slide-render s-section-layout" style="background:${esc(bg)};color:${esc(fg)}">
      <div class="s-side-bar" style="background:${esc(primary)}"></div>
      <div class="s-section-title">${esc(s.title)}</div>
      <div class="s-section-underline" style="background:${esc(fg)}"></div>
    </div>`;
  },

  content(s, brand, idx, total) {
    const slideBg = brand.presentation.slideBackground || '#F7F8FA';
    const tc = brand.colors.text;
    const accent = brand.colors.accent;
    const items = (s.items || []).map((it) =>
      `<div class="s-bullet-item"><span class="s-bullet-dot" style="background:${esc(accent)}"></span><span style="color:${esc(tc)}">${esc(it)}</span></div>`
    ).join('');
    return `<div class="slide-render" style="background:${esc(slideBg)}">
      ${headerHtml(s.title, brand)}
      <div class="s-content"><div class="s-bullet-list">${items}</div></div>
      ${footerHtml(idx, total, brand)}
    </div>`;
  },

  two_column(s, brand, idx, total) {
    const slideBg = brand.presentation.slideBackground || '#F7F8FA';
    const tc = brand.colors.text;
    const accent = brand.colors.accent;
    const left = (s.left || []).map((it) =>
      `<div class="s-bullet-item"><span class="s-bullet-dot" style="background:${esc(accent)}"></span><span style="color:${esc(tc)}">${esc(it)}</span></div>`
    ).join('');
    const right = (s.right || []).map((it) =>
      `<div class="s-bullet-item"><span class="s-bullet-dot" style="background:${esc(accent)}"></span><span style="color:${esc(tc)}">${esc(it)}</span></div>`
    ).join('');
    return `<div class="slide-render" style="background:${esc(slideBg)}">
      ${headerHtml(s.title, brand)}
      <div class="s-content">
        <div class="s-two-col">
          <div class="s-col">${left}</div>
          <div class="s-col-divider" style="background:${esc(accent)}"></div>
          <div class="s-col">${right}</div>
        </div>
      </div>
      ${footerHtml(idx, total, brand)}
    </div>`;
  },

  big_number(s, brand) {
    const bg = brand.colors.primary;
    const fg = textColorOn(bg);
    const accent = brand.colors.accent;
    return `<div class="slide-render s-big-number-layout" style="background:${esc(bg)};color:${esc(fg)}">
      <div class="s-big-number-deco" style="background:${esc(accent)}"></div>
      <div class="s-number">${esc(s.number)}</div>
      <div class="s-number-line" style="background:${esc(accent)}"></div>
      <div class="s-number-label" style="color:${esc(accent)}">${esc(s.label)}</div>
      <div class="s-number-desc">${esc(s.description)}</div>
    </div>`;
  },

  quote(s, brand, idx, total) {
    const slideBg = brand.presentation.slideBackground || '#F7F8FA';
    const accent = brand.colors.accent;
    const primary = brand.colors.primary;
    return `<div class="slide-render" style="background:${esc(slideBg)}">
      <div class="s-quote-bar" style="background:${esc(accent)}"></div>
      <div class="s-quote-mark" style="color:${esc(accent)}">\u201C</div>
      <div class="s-quote-text" style="color:${esc(primary)}">${esc(s.quote)}</div>
      <div class="s-quote-author" style="color:${esc(accent)}">\u2014 ${esc(s.author)}</div>
      ${footerHtml(idx, total, brand)}
    </div>`;
  },

  conclusion(s, brand, idx, total) {
    const slideBg = brand.presentation.slideBackground || '#F7F8FA';
    const tc = brand.colors.text;
    const accent = brand.colors.accent;
    const items = (s.items || []).map((it, i) =>
      `<div class="s-conclusion-item">
        <span class="s-conclusion-num" style="background:${esc(accent)};color:#fff">${i + 1}</span>
        <span style="color:${esc(tc)}">${esc(it)}</span>
      </div>`
    ).join('');
    return `<div class="slide-render" style="background:${esc(slideBg)}">
      ${headerHtml(s.title, brand)}
      <div class="s-content"><div class="s-conclusion-items">${items}</div></div>
      ${footerHtml(idx, total, brand)}
    </div>`;
  },

  thank_you(s, brand) {
    const bg = brand.colors.primary;
    const fg = textColorOn(bg);
    const accent = brand.colors.accent;
    return `<div class="slide-render s-thankyou-layout" style="background:${esc(bg)};color:${esc(fg)}">
      <div class="s-thankyou-deco" style="background:${esc(accent)}"></div>
      <div class="s-ty-title">${esc(s.title)}</div>
      <div class="s-ty-line" style="background:${esc(accent)}"></div>
      <div class="s-ty-subtitle" style="color:${esc(accent)}">${esc(s.subtitle)}</div>
    </div>`;
  },

  chart_bar(s, brand, idx, total) {
    const slideBg = brand.presentation.slideBackground || '#F7F8FA';
    const uid = `chart-${Math.random().toString(36).slice(2, 9)}`;
    const desc = s.description ? `<div class="s-chart-desc" style="color:${esc(brand.colors.text)}">${esc(s.description)}</div>` : '';
    return `<div class="slide-render" style="background:${esc(slideBg)}">
      ${headerHtml(s.title, brand)}
      <div class="s-content"><div class="s-chart-wrap"><canvas id="${uid}"></canvas>${desc}</div></div>
      ${footerHtml(idx, total, brand)}
    </div>`;
  },

  chart_pie(s, brand, idx, total) {
    const slideBg = brand.presentation.slideBackground || '#F7F8FA';
    const uid = `chart-${Math.random().toString(36).slice(2, 9)}`;
    const desc = s.description ? `<div class="s-chart-desc" style="color:${esc(brand.colors.text)}">${esc(s.description)}</div>` : '';
    return `<div class="slide-render" style="background:${esc(slideBg)}">
      ${headerHtml(s.title, brand)}
      <div class="s-content"><div class="s-chart-wrap"><canvas id="${uid}"></canvas>${desc}</div></div>
      ${footerHtml(idx, total, brand)}
    </div>`;
  },

  chart_line(s, brand, idx, total) {
    const slideBg = brand.presentation.slideBackground || '#F7F8FA';
    const uid = `chart-${Math.random().toString(36).slice(2, 9)}`;
    const desc = s.description ? `<div class="s-chart-desc" style="color:${esc(brand.colors.text)}">${esc(s.description)}</div>` : '';
    return `<div class="slide-render" style="background:${esc(slideBg)}">
      ${headerHtml(s.title, brand)}
      <div class="s-content"><div class="s-chart-wrap"><canvas id="${uid}"></canvas>${desc}</div></div>
      ${footerHtml(idx, total, brand)}
    </div>`;
  },

  table(s, brand, idx, total) {
    const slideBg = brand.presentation.slideBackground || '#F7F8FA';
    const tc = brand.colors.text;
    const primary = brand.colors.primary;
    const headFg = textColorOn(primary);
    const ths = (s.headers || []).map((h) => `<th style="background:${esc(primary)};color:${esc(headFg)}">${esc(h)}</th>`).join('');
    const rows = (s.rows || []).map((row, ri) => {
      const bg = ri % 2 === 0 ? '#EEF2FF' : '#FFFFFF';
      return `<tr>${row.map((cell) => `<td style="background:${bg};color:${esc(tc)}">${esc(String(cell))}</td>`).join('')}</tr>`;
    }).join('');
    return `<div class="slide-render" style="background:${esc(slideBg)}">
      ${headerHtml(s.title, brand)}
      <div class="s-content"><table class="s-table"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table></div>
      ${footerHtml(idx, total, brand)}
    </div>`;
  },

  timeline(s, brand, idx, total) {
    const slideBg = brand.presentation.slideBackground || '#F7F8FA';
    const primary = brand.colors.primary;
    const accent = brand.colors.accent;
    const tc = brand.colors.text;
    const events = (s.events || []).slice(0, 6);
    const n = events.length;
    if (!n) return `<div class="slide-render" style="background:${esc(slideBg)}">${headerHtml(s.title, brand)}${footerHtml(idx, total, brand)}</div>`;

    const contentW = 892;
    const contentH = 408;
    const startX = 40;
    const endX = contentW - 40;
    const lineY = contentH / 2;
    const step = n > 1 ? (endX - startX) / (n - 1) : 0;

    let eventsHtml = `<div class="s-timeline-line" style="background:${esc(primary)};top:${lineY - 3}px;left:${startX}px;width:${endX - startX}px"></div>`;
    events.forEach((ev, i) => {
      const x = n === 1 ? (startX + endX) / 2 : startX + i * step;
      const above = i % 2 === 0;
      eventsHtml += `<div class="s-timeline-dot" style="background:${esc(accent)};border:3px solid ${esc(primary)};width:22px;height:22px;left:${x - 11}px;top:${lineY - 11}px"></div>`;
      const labelTop = above ? lineY - 120 : lineY + 30;
      eventsHtml += `<div class="s-timeline-label" style="left:${x - 70}px;top:${labelTop}px;width:140px">
        <div style="font-weight:700;color:${esc(accent)}">${esc(ev.date)}</div>
        <div style="font-weight:600;color:${esc(primary)};font-size:13px;margin-top:2px">${esc(ev.title)}</div>
        ${ev.description ? `<div style="color:${esc(tc)};font-size:10px;margin-top:2px;opacity:.8">${esc(ev.description)}</div>` : ''}
      </div>`;
    });

    return `<div class="slide-render" style="background:${esc(slideBg)}">
      ${headerHtml(s.title, brand)}
      <div class="s-content"><div class="s-timeline-wrap">${eventsHtml}</div></div>
      ${footerHtml(idx, total, brand)}
    </div>`;
  },
};

export function renderSlideHtml(slide, brand, idx, total) {
  const fn = layouts[slide.layout];
  if (fn) return fn(slide, brand, idx, total);
  return layouts.content(slide, brand, idx, total);
}

export function hydrateCharts(container, slide, brand) {
  if (!slide.chartData) return;
  const colors = brand.presentation.chartColorSequence || ['#1A1A2E', '#4F46E5', '#06B6D4', '#E94560'];
  const canvas = container.querySelector('canvas');
  if (!canvas) return;

  requestAnimationFrame(() => {
    if (slide.layout === 'chart_bar')  renderBarChart(canvas, slide.chartData, colors);
    if (slide.layout === 'chart_pie')  renderPieChart(canvas, slide.chartData, colors);
    if (slide.layout === 'chart_line') renderLineChart(canvas, slide.chartData, colors);
  });
}
