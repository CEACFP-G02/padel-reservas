import { IsoDate } from '../models';

const DAY = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/** `2026-06-08` → `lunes, 8 de junio` (read as a local date, so no timezone shift). */
export function formatDay(date: IsoDate): string {
  const [year, month, day] = date.split('-').map(Number);
  return DAY.format(new Date(year, month - 1, day));
}

/** `16` → `16,00 €`. */
export function formatPrice(amount: number): string {
  return EUR.format(amount);
}

const SHORT_DATE = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Madrid',
});

/** `2026-06-08T10:15:00Z` → `8 jun 2026` (the club's local day). */
export function formatTimestamp(timestamp: string): string {
  return SHORT_DATE.format(new Date(timestamp)).replace('.', '');
}
