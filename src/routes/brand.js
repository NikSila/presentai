import { Router } from 'express';
import fs from 'fs';
import uploadMiddleware from '../middleware/upload.js';
import { analyzeBrand } from '../services/ai/brandAnalyzer.js';

const router = Router();

// POST /api/brand/images — analyze uploaded brand images
router.post('/images', (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'No images uploaded' });

    try {
      const images = files.map((f) => ({
        data: fs.readFileSync(f.path).toString('base64'),
        mediaType: f.mimetype,
      }));
      const brand = await analyzeBrand({ images });
      res.json(brand);
    } catch (e) {
      res.status(500).json({ error: e.message });
    } finally {
      files.forEach((f) => { try { fs.unlinkSync(f.path); } catch {} });
    }
  });
});

// POST /api/brand/url — analyze brand from URL
router.post('/url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PresentAI/1.0)' },
    });
    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || '';

    if (contentType.startsWith('image/')) {
      const buf = Buffer.from(await response.arrayBuffer());
      const mediaType = contentType.split(';')[0].trim();
      const brand = await analyzeBrand({ images: [{ data: buf.toString('base64'), mediaType }] });
      return res.json(brand);
    }

    const html = await response.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 20000);

    const brand = await analyzeBrand({ htmlText: text });
    res.json(brand);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
