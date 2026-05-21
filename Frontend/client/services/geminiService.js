import { GoogleGenAI } from "@google/genai";

// Initialize only if we have an API key.
// This prevents the whole app from crashing when `GEMINI_API_KEY` is not set.
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const geminiService = {
  async getCareerInsight(role, name) {
    if (!ai) {
      return "Focus on connecting with alumni in your target industry and updating your technical portfolio.";
    }
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I am ${name}, a ${role} on a professional alumni networking site. Give me 3 sharp, bulleted career growth tips for this week. Be professional and high-impact.`,
      });
      return response.text;
    } catch (err) {
      return "Focus on connecting with alumni in your target industry and updating your technical portfolio.";
    }
  }
};