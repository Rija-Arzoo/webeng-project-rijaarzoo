import { createRequire } from 'module';
import { config } from '../config/index.js';
import { userRepository } from '../repositories/userRepository.js';
import {
  extractIndustryFromText,
  extractSkillsFromText,
  suggestedTopicsForSkills,
} from '../utils/skills.js';

let PDFParseClass = null;

async function getPDFParse() {
  if (!PDFParseClass) {
    const require = createRequire(import.meta.url);
    const mod = require('pdf-parse');
    PDFParseClass = mod.PDFParse || mod.default?.PDFParse || mod;
  }
  return PDFParseClass;
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

    const PDFParse = await getPDFParse();
    const parser = new PDFParse({ data: fileBuffer });
    const parsed = await parser.getText();
    const text = (parsed?.text || '').toString();

    if (!text.trim()) {
      return { status: 400, body: { message: 'Could not extract text from this PDF' } };
    }

    const resumeSkills = extractSkillsFromText(text);
    const resumeSuggestedIndustry = extractIndustryFromText(text);
    const resumeSuggestedTopics = suggestedTopicsForSkills(
      resumeSkills,
      resumeSuggestedIndustry
    );

    user.resumeText = text.slice(0, config.resumeTextMaxLength);
    user.resumeSkills = resumeSkills;
    user.resumeSuggestedIndustry = resumeSuggestedIndustry;
    user.resumeSuggestedTopics = resumeSuggestedTopics;
    user.resumeUploadedAt = new Date();

    await userRepository.save(user);

    return {
      status: 200,
      body: {
        success: true,
        resumeSkills,
        resumeSuggestedIndustry,
        resumeSuggestedTopics,
      },
    };
  },
};
