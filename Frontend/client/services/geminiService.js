import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const DEFAULT_TIP =
  'Focus on connecting with alumni in your target industry and updating your technical portfolio.';

const withClientTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(DEFAULT_TIP), ms)),
  ]);

export const geminiService = {
  async getCareerInsight(role, name) {
    if (!ai) return DEFAULT_TIP;
    try {
      const task = ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `I am ${name}, a ${role} on a professional alumni networking site. Give me 3 sharp, bulleted career growth tips for this week. Be professional and high-impact.`,
      });
      const response = await withClientTimeout(task, 8000);
      if (typeof response === 'string') return response;
      return response?.text || DEFAULT_TIP;
    } catch {
      return DEFAULT_TIP;
    }
  },
};