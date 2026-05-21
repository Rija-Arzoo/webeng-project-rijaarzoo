const DEFAULT_TIP =
  'Focus on connecting with alumni in your target industry and updating your technical portfolio.';

const withClientTimeout = (promise, ms = 6000) =>
  Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(DEFAULT_TIP), ms)),
  ]);

let genaiModule = null;

async function getGenAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return null;
  if (!genaiModule) {
    const { GoogleGenAI } = await import('@google/genai');
    genaiModule = new GoogleGenAI({ apiKey });
  }
  return genaiModule;
}

export const geminiService = {
  async getCareerInsight(role, name) {
    try {
      const ai = await getGenAI();
      if (!ai) return DEFAULT_TIP;

      const task = ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `I am ${name}, a ${role} on a professional alumni networking site. Give me 3 sharp, bulleted career growth tips for this week. Be professional and high-impact.`,
      });
      const response = await withClientTimeout(task, 6000);
      if (typeof response === 'string') return response;
      return response?.text || DEFAULT_TIP;
    } catch {
      return DEFAULT_TIP;
    }
  },
};
