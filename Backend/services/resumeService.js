import { installPdfNodePolyfills } from '../lib/pdfNodePolyfill.js';
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
    installPdfNodePolyfills();
    const mod = await import('pdf-parse');
    PDFParseClass = mod.PDFParse;
    if (!PDFParseClass) {
      throw new Error('PDF parser unavailable');
    }
  }
  return PDFParseClass;
}

async function extractPdfText(fileBuffer) {
  const PDFParse = await getPDFParse();
  const parser = new PDFParse({ data: fileBuffer });
  const parsed = await parser.getText();
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
    let text = '';
    try {
      text = await extractPdfText(fileBuffer);
    } catch (err) {
      const msg = err?.message || String(err);
      if (/DOMMatrix|ImageData|Path2D/i.test(msg)) {
        return {
          status: 500,
          body: {
            message:
              'Resume parsing is not available on this server. Please contact support or try again later.',
          },
        };
      }
      return {
        status: 400,
        body: { message: msg || 'Could not read this PDF file' },
      };
    }

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
