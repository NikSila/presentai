import { Router } from 'express';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { generateSlides } from '../services/ai/slideGenerator.js';
import { buildPptx } from '../services/pptx/builder.js';

const router = Router();

const DEFAULT_BRAND = {
  colors: { primary: '#1A1A2E', secondary: '#16213E', accent: '#4F46E5', background: '#F7F8FA', text: '#2D3748', additional: [] },
  typography: { headingFont: 'Calibri', bodyFont: 'Calibri', headingWeight: 700, style: 'clean' },
  brand: { name: '', industry: '', tone: 'professional', personality: [], visualStyle: 'corporate', audienceType: '' },
  presentation: { slideBackground: '#F7F8FA', headerStyle: 'dark', chartColorSequence: ['#1A1A2E', '#4F46E5', '#06B6D4', '#E94560'], designNotes: '' },
};

// POST /api/presentation/generate
router.post('/generate', async (req, res) => {
  try {
    const { topic, instructions, brand } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'topic is required' });
    const slides = await generateSlides(topic.trim(), instructions, brand);
    res.json({ slides });
  } catch (e) {
    console.error('generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/presentation/export
router.post('/export', async (req, res) => {
  const tmp = path.join(os.tmpdir(), `pres-${Date.now()}.pptx`);
  try {
    const { slides, brand } = req.body;
    if (!Array.isArray(slides) || !slides.length) {
      return res.status(400).json({ error: 'slides array is required' });
    }
    await buildPptx(slides, brand || DEFAULT_BRAND, tmp);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="presentation-${Date.now()}.pptx"`);
    const stream = fs.createReadStream(tmp);
    stream.pipe(res);
    stream.on('end', () => { try { fs.unlinkSync(tmp); } catch {} });
    stream.on('error', () => { try { fs.unlinkSync(tmp); } catch {} });
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch {}
    console.error('export error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
