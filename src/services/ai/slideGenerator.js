import { complete } from './client.js';
import { extractJson } from '../../utils/json.js';

const SYSTEM = `You are an expert presentation designer and storyteller.
Create professional, engaging presentations with varied layouts and compelling content.
Return ONLY a valid JSON array. No markdown, no explanation.`;

function buildPrompt(topic, instructions, brand) {
  const b = brand ? `
Brand context:
- Visual style: ${brand.brand.visualStyle}
- Tone: ${brand.brand.tone}
- Industry: ${brand.brand.industry}
- Audience: ${brand.brand.audienceType}
- Design notes: ${brand.presentation.designNotes}` : '';

  return `Create a professional presentation about: "${topic}"
${instructions ? `Additional requirements: ${instructions}` : ''}
${b}

Rules:
- 10-14 slides total
- First slide layout must be "title", last must be "thank_you"
- Use AT LEAST 5 different layout types
- Include AT LEAST 2 chart slides with REAL specific numbers
- Include AT LEAST 1 table slide and 1 timeline slide
- No placeholder text — all content must be specific and professional

Available layouts:
1.  title:       { layout, title, subtitle }
2.  section:     { layout, title }
3.  content:     { layout, title, items[] }
4.  two_column:  { layout, title, left[], right[] }
5.  big_number:  { layout, number, label, description }
6.  quote:       { layout, quote, author }
7.  conclusion:  { layout, title, items[] }
8.  thank_you:   { layout, title, subtitle }
9.  chart_bar:   { layout, title, description, chartData: { labels[], series[{ name, data[] }] } }
10. chart_pie:   { layout, title, description, chartData: { labels[], values[] } }
11. chart_line:  { layout, title, description, chartData: { labels[], series[{ name, data[] }] } }
12. table:       { layout, title, headers[], rows[][] }
13. timeline:    { layout, title, events[{ date, title, description }] }

Return a JSON array of slide objects.`;
}

export async function generateSlides(topic, instructions, brand) {
  const raw = await complete({
    system: SYSTEM,
    user: buildPrompt(topic, instructions, brand),
    maxTokens: 6000,
    prefill: '[',
  });

  const slides = extractJson(raw);
  if (!Array.isArray(slides)) throw new Error('Invalid slides from AI');
  return slides.map((s, i) => ({ ...s, id: `s-${Date.now()}-${i}` }));
}
