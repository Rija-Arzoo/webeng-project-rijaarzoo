import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const aiService = {
  async getCareerStrategy(userRole, userName) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a career coach on a university alumni network. User ${userName} is a ${userRole}. 
        Provide 2 punchy, actionable career networking tips for them this week. Format as short bullets.`,
      });
      return response.text;
    } catch (err) {
      return "Focus on connecting with at least one alumnus in your target industry this week.";
    }
  }
};