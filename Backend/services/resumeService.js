import { createRequire } from 'module';
import { config } from '../config/index.js';
import { userRepository } from '../repositories/userRepository.js';
import { mapProfileResponse } from '../mappers/userMapper.js';
import {
  applyResumeInsightsToUser,
  buildResumeInsights,
} from './resumeInsightsBuilder.js';

const require = createRequire(import.meta.url);
let pdfParseFn = null;

async function loadPdfParse() {
  if (!pdfParseFn) {
    try {
      const mod = await import('pdf-parse');
      pdfParseFn = mod.default || mod;
    } catch {
      pdfParseFn = require('pdf-parse');
    }
    if (typeof pdfParseFn !== 'function') {
      throw new Error('pdf-parse function is unavailable');
    }
  }
  return pdfParseFn;
}

async function extractPdfText(fileBuffer) {
  const pdfParse = await loadPdfParse();
  const parsed = await pdfParse(fileBuffer);
  return (parsed?.text || '').toString();
}

export const resumeService = {
  async uploadResume(userId, fileBuffer) {
    if (!fileBuffer) {
      return { status: 400, body: { message: 'Resume file is required' } };
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return { status: 404, body: { message: 'User not found' } };
    }

    const text = await extractPdfText(fileBuffer);

    if (!text.trim()) {
      return { status: 400, body: { message: 'Could not extract text from this PDF' } };
    }

    user.resumeText = text.slice(0, config.resumeTextMaxLength);
    user.resumeUploadedAt = new Date();

    const insights = await buildResumeInsights(text, user);
    applyResumeInsightsToUser(user, insights);

    await userRepository.save(user);

    return {
      status: 200,
      body: {
        success: true,
        analyzedWithAi: insights.analyzedWithAi,
        resumeSkills: insights.resumeSkills,
        resumeSuggestedIndustry: insights.resumeSuggestedIndustry,
        resumeSuggestedTopics: insights.resumeSuggestedTopics,
        resumeInsightSummary: insights.resumeInsightSummary,
        resumeUploadedAt: user.resumeUploadedAt,
        profile: mapProfileResponse(user),
      },
    };
  },

  async refreshInsights(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      return { status: 404, body: { message: 'User not found' } };
    }
    if (!user.resumeText?.trim()) {
      return {
        status: 400,
        body: { message: 'Upload a resume on your Profile page first' },
      };
    }

    const insights = await buildResumeInsights(user.resumeText, user, { quick: true });
    applyResumeInsightsToUser(user, insights);
    await userRepository.save(user);

    return {
      status: 200,
      body: {
        success: true,
        analyzedWithAi: insights.analyzedWithAi,
        resumeSkills: insights.resumeSkills,
        resumeSuggestedIndustry: insights.resumeSuggestedIndustry,
        resumeSuggestedTopics: insights.resumeSuggestedTopics,
        resumeInsightSummary: insights.resumeInsightSummary,
        profile: mapProfileResponse(user),
      },
    };
  },
};
