import { config } from '../config/index.js';
import { withTimeout } from '../lib/withTimeout.js';
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

  const geminiResult = await withTimeout(
    analyzeResumeWithGemini(resumeText, userContext),
    config.geminiResumeTimeoutMs,
    null
  );

  if (geminiResult) {
    return geminiResult;
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
  };
}

export function applyResumeInsightsToUser(user, insights) {
  user.resumeSkills = insights.resumeSkills;
  user.resumeSuggestedIndustry = insights.resumeSuggestedIndustry;
  user.resumeSuggestedTopics = insights.resumeSuggestedTopics;
  user.resumeInsightSummary = insights.resumeInsightSummary || '';
}
