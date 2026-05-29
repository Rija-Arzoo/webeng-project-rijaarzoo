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

export function getGeminiModel() {
  return (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
}
