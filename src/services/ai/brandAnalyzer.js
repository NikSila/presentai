import { complete } from './client.js';
import { extractJson } from '../../utils/json.js';
import { isValidHex, ensureHex } from '../../utils/color.js';

const SYSTEM_PROMPT = `You are a professional brand designer and visual strategist. Analyze brand materials deeply.
Your task is to extract a complete, accurate brand identity from any materials provided.
You must return ONLY valid JSON — no prose, no markdown, no extra text.`;

const USER_PROMPT_BASE = `Analyze these brand materials deeply as a professional brand designer. Extract:
1. Complete color palette (find ALL colors used, identify which is primary/secondary/accent/background/text/additional)
2. Typography (identify fonts by name if visible, describe style)
3. Brand personality (tone of voice, personality traits, visual style, target audience)
4. Presentation design recommendations (what slide background to use, chart color sequence, specific design notes for creating presentations in this brand style)

Respond with a single JSON object (no markdown, no code fences, just raw JSON):
{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex",
    "additional": ["#hex", "#hex"]
  },
  "typography": {
    "headingFont": "font name",
    "bodyFont": "font name",
    "headingWeight": 700,
    "style": "description of typography style"
  },
  "brand": {
    "name": "brand name if visible",
    "industry": "inferred industry",
    "tone": "description of tone of voice",
    "personality": ["trait1", "trait2", "trait3"],
    "visualStyle": "description",
    "audienceType": "target audience description"
  },
  "presentation": {
    "slideBackground": "#hex",
    "headerStyle": "description of header bar style",
    "chartColorSequence": ["#hex", "#hex", "#hex", "#hex"],
    "designNotes": "specific actionable notes for creating presentations in this brand style"
  }
}
All hex colors must be exactly #RRGGBB format (6 hex digits, lowercase or uppercase). No short hex, no rgba.`;

const DEFAULTS = {
  colors: {
    primary: '#1A1A2E',
    secondary: '#16213E',
    accent: '#E94560',
    background: '#F7F8FA',
    text: '#2D3748',
    additional: ['#533483', '#0F3460'],
  },
  typography: {
    headingFont: 'Calibri',
    bodyFont: 'Calibri',
    headingWeight: 700,
    style: 'modern geometric sans-serif',
  },
  brand: {
    name: 'Company',
    industry: 'Technology',
    tone: 'professional and innovative',
    personality: ['trustworthy', 'innovative', 'bold'],
    visualStyle: 'corporate-modern',
    audienceType: 'B2B enterprise',
  },
  presentation: {
    slideBackground: '#F7F8FA',
    headerStyle: 'dark bars with light text',
    chartColorSequence: ['#1A1A2E', '#E94560', '#533483', '#0F3460'],
    designNotes: 'Generous whitespace, strong typography hierarchy, geometric accents',
  },
};

function validateColors(colorsObj, defaults) {
  const out = { ...defaults };
  if (!colorsObj || typeof colorsObj !== 'object') return out;

  for (const key of ['primary', 'secondary', 'accent', 'background', 'text']) {
    out[key] = ensureHex(colorsObj[key], defaults[key]);
  }

  if (Array.isArray(colorsObj.additional)) {
    const validAdditional = colorsObj.additional
      .filter((c) => isValidHex(c))
      .slice(0, 6);
    out.additional = validAdditional.length > 0 ? validAdditional : defaults.additional;
  }

  return out;
}

function validateChartColors(arr, fallback) {
  if (!Array.isArray(arr)) return fallback;
  const valid = arr.filter((c) => isValidHex(c)).slice(0, 6);
  return valid.length >= 2 ? valid : fallback;
}

function normalizeBrandAnalysis(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULTS };

  const colors = validateColors(raw.colors, DEFAULTS.colors);

  const typography = {
    headingFont:
      typeof raw.typography?.headingFont === 'string' && raw.typography.headingFont.trim()
        ? raw.typography.headingFont.trim()
        : DEFAULTS.typography.headingFont,
    bodyFont:
      typeof raw.typography?.bodyFont === 'string' && raw.typography.bodyFont.trim()
        ? raw.typography.bodyFont.trim()
        : DEFAULTS.typography.bodyFont,
    headingWeight:
      typeof raw.typography?.headingWeight === 'number'
        ? raw.typography.headingWeight
        : DEFAULTS.typography.headingWeight,
    style:
      typeof raw.typography?.style === 'string' && raw.typography.style.trim()
        ? raw.typography.style.trim()
        : DEFAULTS.typography.style,
  };

  const brand = {
    name:
      typeof raw.brand?.name === 'string' && raw.brand.name.trim()
        ? raw.brand.name.trim()
        : DEFAULTS.brand.name,
    industry:
      typeof raw.brand?.industry === 'string' && raw.brand.industry.trim()
        ? raw.brand.industry.trim()
        : DEFAULTS.brand.industry,
    tone:
      typeof raw.brand?.tone === 'string' && raw.brand.tone.trim()
        ? raw.brand.tone.trim()
        : DEFAULTS.brand.tone,
    personality: Array.isArray(raw.brand?.personality)
      ? raw.brand.personality.filter((t) => typeof t === 'string').slice(0, 5)
      : DEFAULTS.brand.personality,
    visualStyle:
      typeof raw.brand?.visualStyle === 'string' && raw.brand.visualStyle.trim()
        ? raw.brand.visualStyle.trim()
        : DEFAULTS.brand.visualStyle,
    audienceType:
      typeof raw.brand?.audienceType === 'string' && raw.brand.audienceType.trim()
        ? raw.brand.audienceType.trim()
        : DEFAULTS.brand.audienceType,
  };

  const presentation = {
    slideBackground: ensureHex(
      raw.presentation?.slideBackground,
      DEFAULTS.presentation.slideBackground
    ),
    headerStyle:
      typeof raw.presentation?.headerStyle === 'string' && raw.presentation.headerStyle.trim()
        ? raw.presentation.headerStyle.trim()
        : DEFAULTS.presentation.headerStyle,
    chartColorSequence: validateChartColors(
      raw.presentation?.chartColorSequence,
      DEFAULTS.presentation.chartColorSequence
    ),
    designNotes:
      typeof raw.presentation?.designNotes === 'string' && raw.presentation.designNotes.trim()
        ? raw.presentation.designNotes.trim()
        : DEFAULTS.presentation.designNotes,
  };

  return { colors, typography, brand, presentation };
}

/**
 * Analyze brand from images and/or HTML text.
 * @param {object} opts
 * @param {Array<{data: string, mediaType: string}>} [opts.images]
 * @param {string} [opts.htmlText]
 * @returns {Promise<BrandAnalysis>}
 */
export async function analyzeBrand({ images = [], htmlText = '' }) {
  let userPrompt = USER_PROMPT_BASE;

  if (htmlText) {
    // Truncate to avoid token overflow
    const truncated = htmlText.slice(0, 8000);
    userPrompt = `Here is the brand/website content to analyze:\n\n${truncated}\n\n${USER_PROMPT_BASE}`;
  }

  if (images.length === 0 && !htmlText) {
    throw new Error('Provide at least one image or a URL to analyze');
  }

  const raw = await complete({
    system: SYSTEM_PROMPT,
    user: userPrompt,
    images,
    maxTokens: 2048,
    prefill: '{',
  });

  const parsed = extractJson(raw);

  if (!parsed) {
    console.error('Brand analyzer: failed to parse AI response:', raw.slice(0, 500));
    throw new Error('AI returned invalid JSON for brand analysis');
  }

  return normalizeBrandAnalysis(parsed);
}
