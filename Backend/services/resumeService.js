<<<<<<< HEAD
import { installPdfNodePolyfills } from '../lib/pdfNodePolyfill.js';
=======
import { createRequire } from 'module';
>>>>>>> a2b84ca3c62e4c999de1856aaf496bcedaab114d
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
<<<<<<< HEAD
    installPdfNodePolyfills();
    const mod = await import('pdf-parse');
    PDFParseClass = mod.PDFParse;
    if (!PDFParseClass) {
      throw new Error('PDF parser unavailable');
    }
=======
    const require = createRequire(import.meta.url);
    const mod = require('pdf-parse');
    PDFParseClass = mod.PDFParse || mod.default?.PDFParse || mod;
>>>>>>> a2b84ca3c62e4c999de1856aaf496bcedaab114d
  }
  return PDFParseClass;
}

<<<<<<< HEAD
async function extractPdfText(fileBuffer) {
  const PDFParse = await getPDFParse();
  const parser = new PDFParse({ data: fileBuffer });
  const parsed = await parser.getText();
  return (parsed?.text || '').toString();
}

=======
>>>>>>> a2b84ca3c62e4c999de1856aaf496bcedaab114d
export const resumeService = {
  async uploadResume(userId, fileBuffer) {
    if (!fileBuffer) {
      return { status: 400, body: { message: 'Resume file is required' } };
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return { status: 404, body: { message: 'User not found' } };
    }
<<<<<<< HEAD
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
=======

    const PDFParse = await getPDFParse();
    const parser = new PDFParse({ data: fileBuffer });
    const parsed = await parser.getText();
    const text = (parsed?.text || '').toString();
>>>>>>> a2b84ca3c62e4c999de1856aaf496bcedaab114d

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
