import { IsoDate } from '../models';

/** `YYYY-MM-DD` from a local Date or from an ion-datetime ISO value, without timezone shifts. */
export function toIsoDate(value: Date | string): IsoDate {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}
