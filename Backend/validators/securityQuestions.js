export const normalizeSecurityAnswer = (value) =>
  (value || '')
    .toString()
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, ' ');

export const normalizeSecurityAnswerLegacy = (value) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const validateSecurityQuestions = (raw) => {
  if (!Array.isArray(raw) || raw.length !== 2) {
    return { ok: false, message: 'Two security questions are required' };
  }
  const cleaned = raw.map((q) => ({
    question: (q?.question || '').toString().trim(),
    answer: (q?.answer || '').toString(),
  }));
  if (cleaned.some((q) => !q.question || !q.answer.trim())) {
    return { ok: false, message: 'Security questions and answers cannot be empty' };
  }
  const q1 = cleaned[0].question.toLowerCase();
  const q2 = cleaned[1].question.toLowerCase();
  if (q1 === q2) {
    return { ok: false, message: 'Security questions must be different' };
  }
  return { ok: true, cleaned };
};
