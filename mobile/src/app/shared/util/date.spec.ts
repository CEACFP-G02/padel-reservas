import { toIsoDate } from './date';

describe('toIsoDate', () => {
  it('formats a local Date as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('keeps the date part of an ion-datetime ISO value', () => {
    expect(toIsoDate('2026-06-08T18:30:00')).toBe('2026-06-08');
  });

  it('accepts a plain YYYY-MM-DD value', () => {
    expect(toIsoDate('2026-06-08')).toBe('2026-06-08');
  });
});
