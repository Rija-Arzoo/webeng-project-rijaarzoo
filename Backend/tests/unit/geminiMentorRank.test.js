import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applyMentorOrder, rankMentorIdsForStudent } from '../../services/geminiMentorRank.js';

describe('applyMentorOrder', () => {
  const mentors = [
    { user: { _id: 'm1', name: 'Alice' } },
    { user: { _id: 'm2', name: 'Bob' } },
    { user: { _id: 'm3', name: 'Carol' } },
  ];

  it('reorders mentors to match the AI id list', () => {
    const ordered = applyMentorOrder(mentors, ['m3', 'm1', 'm2']);
    expect(ordered.map((m) => m.user._id)).toEqual(['m3', 'm1', 'm2']);
  });
});

describe('rankMentorIdsForStudent', () => {
  let originalKey;

  beforeEach(() => {
    originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.GEMINI_API_KEY = originalKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  });

  it('returns null when GEMINI_API_KEY is not configured', async () => {
    const result = await rankMentorIdsForStudent(
      { skills: ['Python'] },
      [{ id: 'm1', name: 'Mentor', headline: '', industry: '', company: '', skills: [] }],
    );
    expect(result).toBeNull();
  });
});
