import { describe, it, expect } from 'vitest';
import { getInitials } from '../../client/utils/initials.js';

describe('getInitials', () => {
  it('returns up to two letters from first and last name', () => {
    expect(getInitials('Rija Arzoo')).toBe('RA');
  });

  it('returns ?? for empty or missing names', () => {
    expect(getInitials('')).toBe('??');
    expect(getInitials(null)).toBe('??');
  });
});
