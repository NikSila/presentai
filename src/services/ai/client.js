import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import config from '../../config.js';

let anthropicClient = null;
let openaiClient = null;

function getAnthropicClient() {
  if (!anthropicClient) {
    if (!config.anthropic.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    anthropicClient = new Anthropic({ apiKey: config.anthropic.apiKey });
  }
  return anthropicClient;
}

function getOpenAIClient() {
  if (!openaiClient) {
    if (!config.openai.apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    openaiClient = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return openaiClient;
}

async function completeAnthropic({ system, user, images = [], maxTokens = 4096, prefill = null }) {
  const client = getAnthropicClient();

  // Build user message content
  const userContent = [];

  // Add images first
  for (const img of images) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.data,
      },
    });
  }

  // Add text prompt
  userContent.push({ type: 'text', text: user });

  const messages = [{ role: 'user', content: userContent }];

  // Opus models do not support assistant message prefill
  const supportsPrefill = !config.anthropic.model.includes('opus');
  if (prefill && supportsPrefill) {
    messages.push({ role: 'assistant', content: prefill });
  }

  const response = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: maxTokens,
    system,
    messages,
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) {
    throw new Error('No text response from Anthropic');
  }

  return (prefill && supportsPrefill) ? prefill + textBlock.text : textBlock.text;
}

async function completeOpenAI({ system, user, images = [], maxTokens = 4096 }) {
  const client = getOpenAIClient();

  const userContent = [];

  // Add text prompt first
  userContent.push({ type: 'text', text: user });

  // Add images in OpenAI format
  for (const img of images) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${img.mediaType};base64,${img.data}`,
        detail: 'high',
      },
    });
  }

  const response = await client.chat.completions.create({
    model: config.openai.model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
  });

  const message = response.choices[0]?.message?.content;
  if (!message) {
    throw new Error('No text response from OpenAI');
  }
  return message;
}

/**
 * Universal AI completion function.
 * @param {object} opts
 * @param {string} opts.system - System prompt
 * @param {string} opts.user - User prompt
 * @param {Array<{data: string, mediaType: string}>} [opts.images] - Base64 images
 * @param {number} [opts.maxTokens] - Maximum tokens
 * @param {string|null} [opts.prefill] - Prefill string for Anthropic (assistant message start)
 * @returns {Promise<string>} Text response
 */
export async function complete({ system, user, images = [], maxTokens = 4096, prefill = null }) {
  if (config.provider === 'openai') {
    return completeOpenAI({ system, user, images, maxTokens });
  }
  // Default: anthropic
  return completeAnthropic({ system, user, images, maxTokens, prefill });
}
