import 'dotenv/config';

const config = {
  provider: process.env.API_PROVIDER || 'anthropic',
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250514',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  port: parseInt(process.env.PORT) || 3000,
  upload: {
    maxSize: 15 * 1024 * 1024,
    maxFiles: 10,
    dir: 'uploads',
  },
};

export default config;
