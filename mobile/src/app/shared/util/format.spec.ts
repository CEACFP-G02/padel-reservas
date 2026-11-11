import { formatDay, formatPrice, formatTimestamp } from './format';

describe('formatDay', () => {
  it('shows an ISO date as a Spanish weekday, day and month', () => {
    expect(formatDay('2026-06-08')).toBe('lunes, 8 de junio');
  });

  it('does not shift the day with the timezone', () => {
    expect(formatDay('2026-01-01')).toBe('jueves, 1 de enero');
  });
});

describe('formatPrice', () => {
  it('shows euros the Spanish way', () => {
    expect(formatPrice(16)).toBe('16,00 €');
    expect(formatPrice(24.5)).toBe('24,50 €');
  });
});

describe('formatTimestamp', () => {
  it('shows a UTC timestamp as a short Spanish date in Madrid time', () => {
    expect(formatTimestamp('2026-06-08T10:15:00Z')).toBe('8 jun 2026');
    expect(formatTimestamp('2026-06-08T22:30:00Z')).toBe('9 jun 2026');
  });
});
