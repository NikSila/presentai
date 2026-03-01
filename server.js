import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import brandRoutes from './src/routes/brand.js';
import presentationRoutes from './src/routes/presentation.js';
import config from './src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/brand', brandRoutes);
app.use('/api/presentation', presentationRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, provider: config.provider, model: config[config.provider].model });
});

app.put('/api/provider', (req, res) => {
  const { provider } = req.body;
  if (provider !== 'anthropic' && provider !== 'openai') {
    return res.status(400).json({ error: 'provider must be "anthropic" or "openai"' });
  }
  config.provider = provider;
  res.json({ provider: config.provider, model: config[config.provider].model });
});


if (process.env.VERCEL !== '1') {
  app.listen(config.port, () => {
    console.log(`\n🚀  PresentAI  →  http://localhost:${config.port}`);
    console.log(`    Provider: ${config.provider}  /  ${config[config.provider].model}\n`);
  });
}

export default app;
