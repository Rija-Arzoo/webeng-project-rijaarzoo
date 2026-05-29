/**
 * Resolve Gemini API key from env — supports common variable names used in docs / Vercel.
 */
export function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  )
    .trim();
}

export function hasGeminiKey() {
  return Boolean(getGeminiApiKey());
}

/** Models that exist on the current Gemini API (avoid deprecated 1.5 names). */
const FALLBACK_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
];

export function getGeminiModel() {
  return (process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite').trim();
}

export function getGeminiModelFallbacks() {
  const preferred = getGeminiModel();
  const rest = FALLBACK_MODELS.filter((model) => model !== preferred);

  // Free tier often exhausts gemini-2.5-flash first — try lite before the heavy model.
  if (preferred === 'gemini-2.5-flash') {
    return ['gemini-2.5-flash-lite', preferred, ...rest.filter((m) => m !== 'gemini-2.5-flash-lite')];
  }

  return [preferred, ...rest];
}
