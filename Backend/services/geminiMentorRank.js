import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * Re-order mentor ids using Gemini (server-side only).
 * Returns null if no API key, empty list, non-student context, or on failure.
 */
export async function rankMentorIdsForStudent(student, mentorsCompact) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || !mentorsCompact?.length) return null;

  const model = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
  const studentPayload = {
    skills: student?.skills || [],
    headline: student?.headline || '',
    industry: student?.industry || '',
    bio: student?.bio ? String(student.bio).slice(0, 800) : '',
    resumeSuggestedIndustry: student?.resumeSuggestedIndustry || '',
    resumeSuggestedTopics: (student?.resumeSuggestedTopics || []).slice(0, 12),
    resumeSkills: (student?.resumeSkills || []).slice(0, 24),
  };

  const prompt = `You match students with alumni mentors for a university mentorship program.

STUDENT_PROFILE_JSON:
${JSON.stringify(studentPayload)}

MENTORS_JSON (array of {id,name,headline,industry,company,skills}):
${JSON.stringify(mentorsCompact)}

Task: output a JSON array containing every mentor "id" exactly once, ordered from best career/skills fit for this student to weakest. Use only ids from MENTORS_JSON. No markdown, no extra keys — only the JSON array.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const raw = (response?.text || '').trim();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const ids = parsed.map((x) => String(x)).filter(Boolean);
    return ids;
  } catch (err) {
    console.warn('Gemini mentor ranking skipped:', err?.message || err);
    return null;
  }
}

export function applyMentorOrder(mentors, orderedIds) {
  if (!orderedIds?.length) return mentors;
  const byId = new Map(mentors.map((m) => [String(m.user?._id || m.user?.id || ''), m]));
  const seen = new Set();
  const out = [];
  for (const id of orderedIds) {
    const row = byId.get(String(id));
    if (row && !seen.has(String(id))) {
      seen.add(String(id));
      out.push(row);
    }
  }
  for (const m of mentors) {
    const id = String(m.user?._id || m.user?.id || '');
    if (id && !seen.has(id)) out.push(m);
  }
  return out;
}
