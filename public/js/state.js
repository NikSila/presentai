const DEFAULT_BRAND = {
  colors: {
    primary: '#1A1A2E', secondary: '#16213E', accent: '#4F46E5',
    background: '#F7F8FA', text: '#2D3748', additional: [],
  },
  typography: { headingFont: 'Calibri', bodyFont: 'Calibri', headingWeight: 700, style: 'clean' },
  brand: { name: '', industry: '', tone: 'professional', personality: [], visualStyle: 'corporate', audienceType: '' },
  presentation: {
    slideBackground: '#F7F8FA', headerStyle: 'dark',
    chartColorSequence: ['#1A1A2E', '#4F46E5', '#06B6D4', '#E94560'],
    designNotes: '',
  },
};

const LAYOUT_DEFAULTS = {
  title:      { title: 'Slide Title', subtitle: 'Subtitle text' },
  section:    { title: 'Section Title' },
  content:    { title: 'Content Slide', items: ['First point', 'Second point', 'Third point'] },
  two_column: { title: 'Two Columns', left: ['Left item 1', 'Left item 2'], right: ['Right item 1', 'Right item 2'] },
  big_number: { number: '42%', label: 'Key Metric', description: 'Description of this metric' },
  quote:      { quote: 'An inspiring quote goes here.', author: 'Author Name' },
  conclusion: { title: 'Key Takeaways', items: ['Takeaway one', 'Takeaway two', 'Takeaway three'] },
  thank_you:  { title: 'Thank You!', subtitle: 'Questions & Discussion' },
  chart_bar:  { title: 'Bar Chart', description: '', chartData: { labels: ['A', 'B', 'C'], series: [{ name: 'Series 1', data: [30, 50, 20] }] } },
  chart_pie:  { title: 'Pie Chart', description: '', chartData: { labels: ['Segment A', 'Segment B', 'Segment C'], values: [40, 35, 25] } },
  chart_line: { title: 'Line Chart', description: '', chartData: { labels: ['Q1', 'Q2', 'Q3', 'Q4'], series: [{ name: 'Trend', data: [10, 25, 18, 40] }] } },
  table:      { title: 'Data Table', headers: ['Column 1', 'Column 2', 'Column 3'], rows: [['A1', 'A2', 'A3'], ['B1', 'B2', 'B3']] },
  timeline:   { title: 'Timeline', events: [{ date: '2024', title: 'Event 1', description: 'Description' }, { date: '2025', title: 'Event 2', description: 'Description' }] },
};

let state = {
  slides: [],
  currentIndex: -1,
  brand: structuredClone(DEFAULT_BRAND),
  topic: '',
};

const listeners = new Set();

function notify() { listeners.forEach((fn) => fn(state)); }

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function getState() { return state; }

export function update(partial) {
  Object.assign(state, partial);
  notify();
}

export function setSlides(slides) {
  state.slides = slides;
  state.currentIndex = slides.length ? 0 : -1;
  notify();
}

export function selectSlide(index) {
  if (index >= 0 && index < state.slides.length) {
    state.currentIndex = index;
    notify();
  }
}

export function addSlide(layout, afterIndex) {
  const idx = afterIndex != null ? afterIndex + 1 : state.slides.length;
  const defaults = LAYOUT_DEFAULTS[layout] || LAYOUT_DEFAULTS.content;
  const slide = { layout, ...structuredClone(defaults), id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  state.slides.splice(idx, 0, slide);
  state.currentIndex = idx;
  notify();
}

export function duplicateSlide(index) {
  if (index < 0 || index >= state.slides.length) return;
  const copy = structuredClone(state.slides[index]);
  copy.id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  state.slides.splice(index + 1, 0, copy);
  state.currentIndex = index + 1;
  notify();
}

export function deleteSlide(index) {
  if (state.slides.length <= 1) return;
  state.slides.splice(index, 1);
  if (state.currentIndex >= state.slides.length) state.currentIndex = state.slides.length - 1;
  notify();
}

export function moveSlide(from, to) {
  if (from === to) return;
  const [slide] = state.slides.splice(from, 1);
  state.slides.splice(to, 0, slide);
  state.currentIndex = to;
  notify();
}

export function updateSlide(index, data) {
  if (index < 0 || index >= state.slides.length) return;
  Object.assign(state.slides[index], data);
  notify();
}

export function getDefaultBrand() { return structuredClone(DEFAULT_BRAND); }
export { LAYOUT_DEFAULTS };
