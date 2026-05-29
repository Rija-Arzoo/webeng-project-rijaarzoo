/** Parse JSON from Gemini text — handles raw JSON, fenced blocks, or embedded objects/arrays. */
export function parseModelJson(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;

  const tryParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct !== null) return direct;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const parsed = tryParse(fenced[1].trim());
    if (parsed !== null) return parsed;
  }

  const objectStart = trimmed.indexOf('{');
  const objectEnd = trimmed.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    const parsed = tryParse(trimmed.slice(objectStart, objectEnd + 1));
    if (parsed !== null) return parsed;
  }

  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return tryParse(trimmed.slice(arrayStart, arrayEnd + 1));
  }

  return null;
}
