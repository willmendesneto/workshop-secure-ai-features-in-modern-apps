import { describe, expect, it } from 'vitest';
import { InsightSchema } from '../src/index.js';

const validInsight = {
  summary: 'Acme grew revenue 12% this quarter.',
  riskLevel: 'medium',
  recommendations: ['Reduce supplier concentration', 'Hedge currency exposure'],
};

describe('InsightSchema', () => {
  it('parses a valid insight', () => {
    expect(InsightSchema.parse(validInsight)).toEqual(validInsight);
  });

  it('rejects an unknown riskLevel', () => {
    expect(InsightSchema.safeParse({ ...validInsight, riskLevel: 'critical' }).success).toBe(false);
  });

  it('rejects a missing summary', () => {
    const { summary: _omitted, ...withoutSummary } = validInsight;
    expect(InsightSchema.safeParse(withoutSummary).success).toBe(false);
  });

  it('rejects recommendations that are not an array of strings', () => {
    expect(
      InsightSchema.safeParse({ ...validInsight, recommendations: 'do something' }).success,
    ).toBe(false);
    expect(InsightSchema.safeParse({ ...validInsight, recommendations: [42] }).success).toBe(false);
  });

  it('rejects an empty or oversized recommendations list', () => {
    expect(InsightSchema.safeParse({ ...validInsight, recommendations: [] }).success).toBe(false);
    expect(
      InsightSchema.safeParse({ ...validInsight, recommendations: Array(6).fill('x') }).success,
    ).toBe(false);
  });
});
