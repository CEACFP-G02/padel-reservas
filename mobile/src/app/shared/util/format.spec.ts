import { formatDay, formatPrice } from './format';

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
