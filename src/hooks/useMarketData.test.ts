import { describe, it, expect } from 'vitest';
import { getFilterDate } from './useMarketData';

describe('getFilterDate', () => {
  it('1Mは1ヶ月前の日付を返す', () => {
    const now = new Date('2025-01-15');
    const result = getFilterDate('1M', now);
    const expected = new Date('2024-12-15');
    expect(result?.toISOString()).toBe(expected.toISOString());
  });

  it('1Yは1年前の日付を返す', () => {
    const now = new Date('2025-01-15');
    const result = getFilterDate('1Y', now);
    const expected = new Date('2024-01-15');
    expect(result?.toISOString()).toBe(expected.toISOString());
  });

  it('Customはnullを返す', () => {
    const now = new Date('2025-01-15');
    const result = getFilterDate('Custom', now);
    expect(result).toBeNull();
  });
});
