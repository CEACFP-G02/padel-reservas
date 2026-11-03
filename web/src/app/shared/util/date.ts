import { IsoDate } from '../models';

/** Formats a local `Date` (e.g. from mat-datepicker) as `YYYY-MM-DD` without timezone shifts. */
export function toIsoDate(date: Date): IsoDate {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
