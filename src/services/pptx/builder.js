import PptxGenJS from 'pptxgenjs';
import { textColorOn } from '../../utils/color.js';

// Strip # for PptxGenJS
const c = (hex) => (hex || '#888888').replace('#', '');

const W = 13.333;
const H = 7.5;
const HEADER_H = 1.15;
const FOOTER_H = 0.32;
const CONTENT_Y = HEADER_H + 0.2;
const CONTENT_H = H - CONTENT_Y - FOOTER_H - 0.15;
const PAD = 0.45;

// ─── Reusable helpers ──────────────────────────────────────────────────────────

function bg(slide, color) {
  slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: c(color) }, line: { color: c(color) } });
}

function header(slide, title, brand) {
  const fg = c(textColorOn(brand.colors.primary));
  slide.addShape('rect', { x: 0, y: 0, w: W, h: HEADER_H, fill: { color: c(brand.colors.primary) }, line: { color: c(brand.colors.primary) } });
  // accent bottom line on header
  slide.addShape('rect', { x: 0, y: HEADER_H - 0.06, w: W, h: 0.06, fill: { color: c(brand.colors.accent) }, line: { color: c(brand.colors.accent) } });
  slide.addText(title, {
    x: PAD, y: 0, w: W - PAD * 2, h: HEADER_H - 0.06,
    fontSize: 24, bold: true, color: fg,
    fontFace: brand.typography.headingFont, valign: 'middle',
  });
}

function footer(slide, idx, total, brand) {
  slide.addShape('rect', { x: 0, y: H - FOOTER_H, w: W, h: FOOTER_H, fill: { color: c(brand.colors.primary) }, line: { color: c(brand.colors.primary) } });
  slide.addText(`${idx + 1} / ${total}`, {
    x: 0, y: H - FOOTER_H, w: W - PAD, h: FOOTER_H,
    fontSize: 10, color: 'FFFFFF', align: 'right', valign: 'middle',
  });
}

function slideBg(slide, brand) {
  bg(slide, brand.presentation.slideBackground || '#F7F8FA');
}

function chartColors(brand) {
  return brand.presentation.chartColorSequence.map(c);
}

function toSeries(series, labels) {
  return series.map((s) => ({ name: s.name, labels, values: s.data }));
}

// ─── Layout renderers ──────────────────────────────────────────────────────────

const layouts = {

  title(s, slide, brand) {
    bg(slide, brand.colors.primary);
    const ac = c(brand.colors.accent);
    const tc = c(textColorOn(brand.colors.primary));
    // Decorative rectangle top-right
    slide.addShape('rect', { x: W - 3.5, y: 0, w: 3.5, h: H * 0.4, fill: { color: c(brand.colors.accent) + '33' }, line: { color: 'transparent' } });
    slide.addText(s.title, {
      x: PAD, y: 1.6, w: W - 2, h: 2.4,
      fontSize: 42, bold: true, color: tc, fontFace: brand.typography.headingFont,
      valign: 'bottom',
    });
    // Accent line
    slide.addShape('rect', { x: PAD, y: 4.1, w: 3.5, h: 0.07, fill: { color: ac }, line: { color: ac } });
    if (s.subtitle) {
      slide.addText(s.subtitle, {
        x: PAD, y: 4.3, w: W - 2, h: 1.2,
        fontSize: 20, color: ac, fontFace: brand.typography.bodyFont,
      });
    }
    // brand name watermark bottom-right
    if (brand.brand.name) {
      slide.addText(brand.brand.name, {
        x: 0, y: H - 0.6, w: W - PAD, h: 0.55,
        fontSize: 11, color: tc + '66', align: 'right', fontFace: brand.typography.bodyFont,
      });
    }
  },

  section(s, slide, brand) {
    bg(slide, brand.colors.accent);
    const tc = c(textColorOn(brand.colors.accent));
    // Side decorative strip
    slide.addShape('rect', { x: 0, y: 0, w: 0.5, h: H, fill: { color: c(brand.colors.primary) }, line: { color: c(brand.colors.primary) } });
    slide.addText(s.title, {
      x: 1, y: 0, w: W - 1.5, h: H,
      fontSize: 36, bold: true, color: tc, fontFace: brand.typography.headingFont,
      align: 'left', valign: 'middle',
    });
    slide.addShape('rect', { x: 1, y: H / 2 + 1.3, w: 3.5, h: 0.06, fill: { color: tc }, line: { color: tc } });
  },

  content(s, slide, brand, idx, total) {
    slideBg(slide, brand);
    header(slide, s.title, brand);
    footer(slide, idx, total, brand);
    const tc = c(brand.colors.text);
    const ac = c(brand.colors.accent);
    (s.items || []).slice(0, 8).forEach((item, i) => {
      const y = CONTENT_Y + i * 0.68;
      if (y + 0.65 > H - FOOTER_H) return;
      slide.addShape('ellipse', { x: PAD, y: y + 0.22, w: 0.09, h: 0.09, fill: { color: ac }, line: { color: ac } });
      slide.addText(item, {
        x: PAD + 0.22, y, w: W - PAD * 2 - 0.22, h: 0.62,
        fontSize: 17, color: tc, fontFace: brand.typography.bodyFont, valign: 'middle',
      });
    });
  },

  two_column(s, slide, brand, idx, total) {
    slideBg(slide, brand);
    header(slide, s.title, brand);
    footer(slide, idx, total, brand);
    const tc = c(brand.colors.text);
    const ac = c(brand.colors.accent);
    const colW = (W - PAD * 2 - 0.5) / 2;
    const divX = PAD + colW + 0.2;
    slide.addShape('rect', { x: divX, y: CONTENT_Y + 0.1, w: 0.04, h: CONTENT_H - 0.2, fill: { color: ac }, line: { color: ac } });
    (s.left || []).slice(0, 6).forEach((item, i) => {
      slide.addText(`• ${item}`, { x: PAD, y: CONTENT_Y + i * 0.72, w: colW, h: 0.65, fontSize: 15, color: tc, fontFace: brand.typography.bodyFont });
    });
    (s.right || []).slice(0, 6).forEach((item, i) => {
      slide.addText(`• ${item}`, { x: divX + 0.18, y: CONTENT_Y + i * 0.72, w: colW, h: 0.65, fontSize: 15, color: tc, fontFace: brand.typography.bodyFont });
    });
  },

  big_number(s, slide, brand) {
    bg(slide, brand.colors.primary);
    const ac = c(brand.colors.accent);
    const tc = c(textColorOn(brand.colors.primary));
    // Background accent shape
    slide.addShape('ellipse', { x: W - 4, y: -1, w: 6, h: 6, fill: { color: c(brand.colors.accent) + '20' }, line: { color: 'transparent' } });
    slide.addText(s.number, {
      x: 0, y: 1.0, w: W, h: 3.2,
      fontSize: 88, bold: true, color: tc, fontFace: brand.typography.headingFont, align: 'center',
    });
    slide.addShape('rect', { x: W / 2 - 2, y: 4.35, w: 4, h: 0.06, fill: { color: ac }, line: { color: ac } });
    slide.addText(s.label, {
      x: 0.5, y: 4.5, w: W - 1, h: 0.8,
      fontSize: 26, bold: true, color: ac, fontFace: brand.typography.headingFont, align: 'center',
    });
    if (s.description) {
      slide.addText(s.description, {
        x: 1.5, y: 5.4, w: W - 3, h: 0.8,
        fontSize: 15, color: tc + 'CC', fontFace: brand.typography.bodyFont, align: 'center',
      });
    }
  },

  quote(s, slide, brand, idx, total) {
    slideBg(slide, brand);
    footer(slide, idx, total, brand);
    const ac = c(brand.colors.accent);
    const pc = c(brand.colors.primary);
    const tc = c(brand.colors.text);
    slide.addShape('rect', { x: 0.35, y: 0.9, w: 0.14, h: H - 0.9 - FOOTER_H - 0.2, fill: { color: ac }, line: { color: ac } });
    slide.addText('\u201C', { x: 0.7, y: 0.3, w: 2, h: 1.5, fontSize: 90, bold: true, color: ac, fontFace: brand.typography.headingFont });
    slide.addText(s.quote, {
      x: 0.8, y: 1.4, w: W - 1.4, h: 4.2,
      fontSize: 22, italic: true, color: pc, fontFace: brand.typography.bodyFont, valign: 'middle',
    });
    slide.addText(`\u2014 ${s.author}`, {
      x: 0.8, y: H - FOOTER_H - 0.75, w: W - 1.4, h: 0.6,
      fontSize: 14, bold: true, color: ac, align: 'right', fontFace: brand.typography.bodyFont,
    });
  },

  conclusion(s, slide, brand, idx, total) {
    slideBg(slide, brand);
    header(slide, s.title, brand);
    footer(slide, idx, total, brand);
    const pc = c(brand.colors.primary);
    const tc = c(brand.colors.text);
    const ac = c(brand.colors.accent);
    (s.items || []).slice(0, 6).forEach((item, i) => {
      const y = CONTENT_Y + i * 0.78;
      if (y + 0.75 > H - FOOTER_H) return;
      slide.addShape('rect', { x: PAD, y: y + 0.1, w: 0.42, h: 0.52, fill: { color: ac }, line: { color: ac } });
      slide.addText(`${i + 1}`, { x: PAD, y: y + 0.1, w: 0.42, h: 0.52, fontSize: 18, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
      slide.addText(item, { x: PAD + 0.58, y, w: W - PAD * 2 - 0.58, h: 0.72, fontSize: 16, color: tc, fontFace: brand.typography.bodyFont, valign: 'middle' });
    });
  },

  thank_you(s, slide, brand) {
    bg(slide, brand.colors.primary);
    const ac = c(brand.colors.accent);
    const tc = c(textColorOn(brand.colors.primary));
    slide.addShape('rect', { x: 0, y: H * 0.6, w: W, h: H * 0.4, fill: { color: c(brand.colors.accent) + '18' }, line: { color: 'transparent' } });
    slide.addText(s.title, {
      x: 0.5, y: 1.2, w: W - 1, h: 3.2,
      fontSize: 46, bold: true, color: tc, fontFace: brand.typography.headingFont, align: 'center', valign: 'middle',
    });
    slide.addShape('rect', { x: W / 2 - 2.5, y: 4.5, w: 5, h: 0.07, fill: { color: ac }, line: { color: ac } });
    if (s.subtitle) {
      slide.addText(s.subtitle, {
        x: 1, y: 4.7, w: W - 2, h: 1.0,
        fontSize: 19, color: ac, fontFace: brand.typography.bodyFont, align: 'center',
      });
    }
  },

  chart_bar(s, slide, brand, idx, total) {
    slideBg(slide, brand);
    header(slide, s.title, brand);
    footer(slide, idx, total, brand);
    const cc = chartColors(brand);
    const data = toSeries(s.chartData.series, s.chartData.labels);
    const chartH = s.description ? CONTENT_H - 0.5 : CONTENT_H;
    slide.addChart('bar', data, {
      x: PAD, y: CONTENT_Y, w: W - PAD * 2, h: chartH,
      barDir: 'col', chartColors: cc,
      showLegend: s.chartData.series.length > 1, legendPos: 'b',
      showValue: true, valAxisLabelFontSize: 11, catAxisLabelFontSize: 11, dataLabelFontSize: 10,
    });
    if (s.description) {
      slide.addText(s.description, {
        x: PAD, y: CONTENT_Y + chartH + 0.05, w: W - PAD * 2, h: 0.4,
        fontSize: 11, color: c(brand.colors.text), italic: true, align: 'center', fontFace: brand.typography.bodyFont,
      });
    }
  },

  chart_pie(s, slide, brand, idx, total) {
    slideBg(slide, brand);
    header(slide, s.title, brand);
    footer(slide, idx, total, brand);
    const data = [{ name: 'Share', labels: s.chartData.labels, values: s.chartData.values }];
    slide.addChart('doughnut', data, {
      x: 1.8, y: CONTENT_Y, w: W - 3.6, h: CONTENT_H,
      chartColors: chartColors(brand), showLegend: true, legendPos: 'r',
      dataLabelFontSize: 13, showPercent: true,
    });
  },

  chart_line(s, slide, brand, idx, total) {
    slideBg(slide, brand);
    header(slide, s.title, brand);
    footer(slide, idx, total, brand);
    const cc = chartColors(brand);
    const data = toSeries(s.chartData.series, s.chartData.labels);
    slide.addChart('line', data, {
      x: PAD, y: CONTENT_Y, w: W - PAD * 2, h: CONTENT_H,
      chartColors: cc, showLegend: s.chartData.series.length > 1, legendPos: 'b',
      lineSize: 3, showMarker: true, valAxisLabelFontSize: 11, catAxisLabelFontSize: 11,
    });
  },

  table(s, slide, brand, idx, total) {
    slideBg(slide, brand);
    header(slide, s.title, brand);
    footer(slide, idx, total, brand);
    const pc = c(brand.colors.primary);
    const htc = c(textColorOn(brand.colors.primary));
    const tc = c(brand.colors.text);

    const headerRow = (s.headers || []).map((h) => ({
      text: h,
      options: { bold: true, color: htc, fill: pc, align: 'center', fontSize: 14, fontFace: brand.typography.headingFont },
    }));
    const dataRows = (s.rows || []).map((row, ri) =>
      row.map((cell) => ({
        text: String(cell),
        options: { color: tc, fill: ri % 2 === 0 ? 'EEF2FF' : 'FFFFFF', fontSize: 13, align: 'center', fontFace: brand.typography.bodyFont },
      }))
    );
    const colCount = s.headers?.length || 1;
    const colW = (W - PAD * 2) / colCount;
    slide.addTable([headerRow, ...dataRows], {
      x: PAD, y: CONTENT_Y, w: W - PAD * 2,
      colW: Array(colCount).fill(colW),
      border: { type: 'solid', color: 'CBD5E0', pt: 1 },
      rowH: 0.52,
    });
  },

  timeline(s, slide, brand, idx, total) {
    slideBg(slide, brand);
    header(slide, s.title, brand);
    footer(slide, idx, total, brand);
    const pc = c(brand.colors.primary);
    const ac = c(brand.colors.accent);
    const tc = c(brand.colors.text);
    const events = (s.events || []).slice(0, 6);
    const n = events.length;
    if (!n) return;

    const lineY = CONTENT_Y + CONTENT_H / 2;
    const startX = PAD + 0.5;
    const endX = W - PAD - 0.5;
    const step = n > 1 ? (endX - startX) / (n - 1) : 0;

    // Horizontal line
    slide.addShape('rect', { x: startX, y: lineY - 0.04, w: endX - startX, h: 0.08, fill: { color: pc }, line: { color: pc } });

    events.forEach((ev, i) => {
      const x = n === 1 ? (startX + endX) / 2 : startX + i * step;
      const above = i % 2 === 0;

      // Dot
      slide.addShape('ellipse', { x: x - 0.17, y: lineY - 0.17, w: 0.34, h: 0.34, fill: { color: ac }, line: { color: pc } });

      // Connector line
      const connH = 0.45;
      slide.addShape('rect', { x: x - 0.02, y: above ? lineY - connH - 0.15 : lineY + 0.15, w: 0.04, h: connH, fill: { color: pc }, line: { color: pc } });

      const labelY = above ? lineY - connH - 1.4 : lineY + connH + 0.2;
      slide.addText(ev.date, { x: x - 0.9, y: labelY, w: 1.8, h: 0.38, fontSize: 11, bold: true, color: ac, align: 'center', fontFace: brand.typography.headingFont });
      slide.addText(ev.title, { x: x - 0.9, y: labelY + 0.4, w: 1.8, h: 0.42, fontSize: 13, bold: true, color: pc, align: 'center', fontFace: brand.typography.headingFont });
      if (ev.description) {
        slide.addText(ev.description, { x: x - 0.95, y: labelY + 0.85, w: 1.9, h: 0.55, fontSize: 10, color: tc, align: 'center', fontFace: brand.typography.bodyFont });
      }
    });
  },
};

// ─── Main export ───────────────────────────────────────────────────────────────

export async function buildPptx(slides, brand, outputPath) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  const total = slides.length;
  slides.forEach((s, idx) => {
    const slide = pptx.addSlide();
    const fn = layouts[s.layout];
    if (fn) fn(s, slide, brand, idx, total);
    else layouts.content(s, slide, brand, idx, total);
  });

  await pptx.writeFile({ fileName: outputPath });
}
