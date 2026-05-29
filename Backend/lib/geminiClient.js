import { getGeminiApiKey, getGeminiModelFallbacks } from './geminiConfig.js';

/**
 * Call Gemini REST API (reliable on Vercel serverless — no heavy SDK bundle).
 */
async function callGeminiRest(apiKey, model, prompt, options = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const requestTimeoutMs = options.requestTimeoutMs || 24_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: options.responseMimeType || 'application/json',
          maxOutputTokens: options.maxOutputTokens || 768,
          temperature: options.temperature ?? 0.2,
        },
      }),
    });

    const rawBody = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${rawBody.slice(0, 400)}`);
    }

    let data;
    try {
      data = JSON.parse(rawBody);
    } catch {
      throw new Error('Invalid JSON from Gemini API');
    }

    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || '')
      .join('')
      .trim();

    if (!text) {
      const blockReason =
        data?.promptFeedback?.blockReason ||
        data?.candidates?.[0]?.finishReason ||
        'no text';
      throw new Error(`Empty Gemini response (${blockReason})`);
    }

    return text;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Gemini request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generate text with automatic model fallback when a model is unavailable.
 */
export async function generateGeminiText(prompt, options = {}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const models = options.models || getGeminiModelFallbacks();
  let lastError = null;

  for (const model of models) {
    try {
      const text = await callGeminiRest(apiKey, model, prompt, options);
      return { text, model };
    } catch (err) {
      lastError = err;
      console.warn(`Gemini model ${model} failed:`, err?.message || err);
    }
  }

  throw lastError || new Error('All Gemini models failed');
}
