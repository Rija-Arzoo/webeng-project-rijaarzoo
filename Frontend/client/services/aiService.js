import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const aiService = {
  async getCareerInsight(userRole, userName) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I am ${userName}, a ${userRole} on a professional alumni networking site. Give me 3 sharp, bulleted career growth tips for this week. Be professional and high-impact.`,
      });
      return response.text;
    } catch (err) {
      return "Focus on connecting with 3 alumni in your target industry and updating your technical portfolio.";
    }
  }
};