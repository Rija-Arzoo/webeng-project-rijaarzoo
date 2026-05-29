import { GoogleGenAI } from '@google/genai';
import { normalizeSkillDisplay } from '../utils/skills.js';

const DEFAULT_MODEL = 'gemini-2.0-flash';

const ALLOWED_INDUSTRIES = new Set([
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Consulting',
  'Manufacturing',
  'Retail',
  'Media & Entertainment',
  'Transportation',
]);

export function normalizeGeminiResumeAnalysis(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const resumeSkills = (Array.isArray(raw.resumeSkills) ? raw.resumeSkills : [])
    .map((s) => {
      const normalized = normalizeSkillDisplay(String(s));
      if (!normalized) return '';
      if (normalized === normalized.toLowerCase() && normalized.length > 1) {
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
      }
      return normalized;
    })
    .filter(Boolean)
    .slice(0, 12);

  let resumeSuggestedIndustry = (raw.resumeSuggestedIndustry || '').toString().trim();
  if (!ALLOWED_INDUSTRIES.has(resumeSuggestedIndustry)) {
    const match = [...ALLOWED_INDUSTRIES].find(
      (i) => i.toLowerCase() === resumeSuggestedIndustry.toLowerCase()
    );
    resumeSuggestedIndustry = match || 'Technology';
  }

  const resumeSuggestedTopics = (Array.isArray(raw.resumeSuggestedTopics)
    ? raw.resumeSuggestedTopics
    : []
  )
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 5);

  const resumeInsightSummary = String(raw.resumeInsightSummary || '')
    .trim()
    .slice(0, 600);

  if (
    resumeSkills.length === 0 &&
    !resumeInsightSummary &&
    resumeSuggestedTopics.length === 0
  ) {
    return null;
  }

  return {
    resumeSkills,
    resumeSuggestedIndustry,
    resumeSuggestedTopics,
    resumeInsightSummary,
    analyzedWithAi: true,
  };
}

/**
 * Analyze resume text with Gemini. Returns null if no API key or on failure.
 */
export async function analyzeResumeWithGemini(resumeText, userContext = {}, options = {}) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || !resumeText?.trim()) return null;

  const quick = options.quick === true;
  const model = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
  const excerpt = resumeText.trim().slice(0, quick ? 6_000 : 10_000);

  const context = {
    name: userContext.name || '',
    role: userContext.role || 'student',
    university: userContext.university || '',
    department: userContext.department || '',
    degreeLevel: userContext.degreeLevel || '',
  };

  const prompt = quick
    ? `Career coach: analyze this resume for a university alumni mentorship platform.

STUDENT: ${JSON.stringify(context)}

RESUME:
${excerpt}

Return ONLY JSON (no markdown):
{"resumeSkills":["Skill1"],"resumeSuggestedIndustry":"Technology","resumeSuggestedTopics":["topic"],"resumeInsightSummary":"2 sentences max"}

Rules: 5-8 resumeSkills (title case); industry one of Technology, Finance, Healthcare, Education, Consulting, Manufacturing, Retail, Media & Entertainment, Transportation; 3-4 topics; summary specific to this resume.`
    : `You are an expert career coach reviewing a resume for a university alumni mentorship platform.

STUDENT_CONTEXT_JSON:
${JSON.stringify(context)}

RESUME_TEXT:
${excerpt}

Read the resume carefully. Base every field only on what appears in the resume — do not invent employers, degrees, or skills.

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "resumeSkills": ["Skill1", "Skill2"],
  "resumeSuggestedIndustry": "Technology",
  "resumeSuggestedTopics": ["topic 1", "topic 2", "topic 3"],
  "resumeInsightSummary": "2-3 sentences on strengths, seniority, and ideal mentor focus"
}

Rules:
- resumeSkills: 5-10 specific skills/tools/domains from the resume (title case).
- resumeSuggestedIndustry: exactly one of: Technology, Finance, Healthcare, Education, Consulting, Manufacturing, Retail, Media & Entertainment, Transportation.
- resumeSuggestedTopics: 3-5 actionable mentorship goals tailored to this person (not generic platitudes).
- resumeInsightSummary: concise, professional, specific to this resume.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: quick ? 384 : 512,
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse((response?.text || '').trim());
    return normalizeGeminiResumeAnalysis(parsed);
  } catch (err) {
    console.warn('Gemini resume analysis failed:', err?.message || err);
    return null;
  }
}
