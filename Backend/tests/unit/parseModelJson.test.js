import { describe, it, expect } from 'vitest';
import { parseModelJson } from '../../lib/parseModelJson.js';

describe('parseModelJson', () => {
  it('parses raw JSON', () => {
    expect(parseModelJson('{"resumeSkills":["Python"]}')).toEqual({
      resumeSkills: ['Python'],
    });
  });

  it('parses fenced JSON', () => {
    const raw = '```json\n{"resumeSkills":["React"]}\n```';
    expect(parseModelJson(raw)).toEqual({ resumeSkills: ['React'] });
  });

  it('parses JSON embedded in text', () => {
    const raw = 'Here is the result:\n{"resumeSkills":["Node.js"]}\nDone.';
    expect(parseModelJson(raw)).toEqual({ resumeSkills: ['Node.js'] });
  });

  it('parses raw JSON arrays', () => {
    expect(parseModelJson('["id1","id2"]')).toEqual(['id1', 'id2']);
  });

  it('returns null for invalid input', () => {
    expect(parseModelJson('')).toBeNull();
    expect(parseModelJson('not json')).toBeNull();
  });
});
