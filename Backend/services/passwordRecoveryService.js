import bcryptjs from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import {
  normalizeSecurityAnswer,
  normalizeSecurityAnswerLegacy,
} from '../validators/securityQuestions.js';

export const passwordRecoveryService = {
  async getSecurityQuestions(email) {
    if (!email) {
      return { status: 400, body: { message: 'Email is required' } };
    }

    const user = await userRepository.findByEmail(
      email.toString().trim().toLowerCase(),
      'securityQuestions'
    );

    if (!user) {
      return { status: 404, body: { message: 'Account not found' } };
    }
    if (!Array.isArray(user.securityQuestions) || user.securityQuestions.length !== 2) {
      return {
        status: 400,
        body: {
          message:
            'Password recovery is not set up for this account. Please contact support or log in to configure security questions.',
        },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        questions: user.securityQuestions.map((q) => ({ question: q.question })),
      },
    };
  },

  async resetPassword({ email, answers, newPassword }) {
    if (!email || !newPassword) {
      return { status: 400, body: { message: 'Email and newPassword are required' } };
    }

    const providedAnswers =
      Array.isArray(answers)
        ? answers
        : answers && typeof answers === 'object'
          ? [answers.answer1, answers.answer2]
          : null;

    if (!Array.isArray(providedAnswers) || providedAnswers.length !== 2) {
      return { status: 400, body: { message: 'Two answers are required' } };
    }
    if (newPassword.toString().length < 6) {
      return { status: 400, body: { message: 'Password must be at least 6 characters' } };
    }

    const user = await userRepository.findByEmail(
      email.toString().trim().toLowerCase(),
      'password securityQuestions'
    );

    if (!user) {
      return { status: 404, body: { message: 'Account not found' } };
    }
    if (!Array.isArray(user.securityQuestions) || user.securityQuestions.length !== 2) {
      return { status: 400, body: { message: 'Password recovery is not set up for this account' } };
    }

    const normalizedAnswers = providedAnswers.map((a) => ({
      primary: normalizeSecurityAnswer(a),
      legacy: normalizeSecurityAnswerLegacy(a),
    }));
    const hashes = user.securityQuestions.map((q) => q.answerHash);

    const matchMatrix = await Promise.all(
      normalizedAnswers.map((ans) =>
        Promise.all(
          hashes.map(async (h) => {
            if (await bcryptjs.compare(ans.primary, h)) return true;
            if (ans.legacy !== ans.primary && (await bcryptjs.compare(ans.legacy, h))) {
              return true;
            }
            return false;
          })
        )
      )
    );

    const usedHashIdx = new Set();
    let matches = 0;
    for (let i = 0; i < matchMatrix.length; i++) {
      const row = matchMatrix[i];
      const idx = row.findIndex((ok, j) => ok && !usedHashIdx.has(j));
      if (idx >= 0) {
        usedHashIdx.add(idx);
        matches += 1;
      }
    }

    if (matches !== 2) {
      return { status: 401, body: { message: 'Security answers do not match' } };
    }

    user.password = await bcryptjs.hash(newPassword.toString(), 10);
    await userRepository.save(user);

    return { status: 200, body: { success: true, message: 'Password updated successfully' } };
  },
};
