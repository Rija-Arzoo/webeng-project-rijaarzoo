import { hasGeminiKey } from '../lib/geminiConfig.js';
import {
  extractIndustryFromText,
  extractSkillsFromText,
  suggestedTopicsForSkills,
} from '../utils/skills.js';
import { analyzeResumeWithGemini } from './geminiResumeAnalysis.js';

/**
 * Build resume insights from extracted PDF text — Gemini when configured, else keyword heuristics.
 */
export async function buildResumeInsights(resumeText, user) {
  const userContext = {
    name: user?.name,
    role: user?.role,
    university: user?.university,
    department: user?.department,
    degreeLevel: user?.degreeLevel,
  };

  const geminiResult = await analyzeResumeWithGemini(resumeText, userContext);

  if (geminiResult) {
    return { ...geminiResult, aiStatus: 'analyzed' };
  }

  const resumeSkills = extractSkillsFromText(resumeText);
  const resumeSuggestedIndustry = extractIndustryFromText(resumeText);
  const resumeSuggestedTopics = suggestedTopicsForSkills(
    resumeSkills,
    resumeSuggestedIndustry
  );

  return {
    resumeSkills,
    resumeSuggestedIndustry,
    resumeSuggestedTopics,
    resumeInsightSummary: '',
    analyzedWithAi: false,
    aiStatus: hasGeminiKey() ? 'unavailable' : 'no_key',
  };
}

export function applyResumeInsightsToUser(user, insights) {
  user.resumeSkills = insights.resumeSkills;
  user.resumeSuggestedIndustry = insights.resumeSuggestedIndustry;
  user.resumeSuggestedTopics = insights.resumeSuggestedTopics;
  user.resumeInsightSummary = insights.resumeInsightSummary || '';
}
