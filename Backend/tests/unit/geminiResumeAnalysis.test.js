import { describe, it, expect } from 'vitest';
import { normalizeGeminiResumeAnalysis } from '../../services/geminiResumeAnalysis.js';

describe('normalizeGeminiResumeAnalysis', () => {
  it('normalizes valid Gemini JSON', () => {
    const result = normalizeGeminiResumeAnalysis({
      resumeSkills: ['python', 'React'],
      resumeSuggestedIndustry: 'technology',
      resumeSuggestedTopics: ['Interview prep', 'Portfolio review'],
      resumeInsightSummary: 'Strong full-stack student with internship experience.',
    });
    expect(result.analyzedWithAi).toBe(true);
    expect(result.resumeSkills).toContain('Python');
    expect(result.resumeSuggestedIndustry).toBe('Technology');
    expect(result.resumeSuggestedTopics).toHaveLength(2);
    expect(result.resumeInsightSummary).toContain('full-stack');
  });

  it('returns null for empty payload', () => {
    expect(normalizeGeminiResumeAnalysis({})).toBeNull();
  });
});
