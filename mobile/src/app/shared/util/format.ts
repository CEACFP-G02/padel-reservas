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
