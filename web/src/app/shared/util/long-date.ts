import { IsoDate } from '../models';

const LONG_DATE = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** `2026-06-08` → `lunes, 8 de junio de 2026` (parsed as a local date, no timezone shift). */
export function longDate(date: IsoDate): string {
  const [year, month, day] = date.split('-').map(Number);
  return LONG_DATE.format(new Date(year, month - 1, day));
}
