import { IsoTime } from './common';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface OpeningHours {
  dayOfWeek: DayOfWeek;
  openTime: IsoTime;
  closeTime: IsoTime;
}

export interface Schedule {
  courtId: number;
  slotDurationMinutes: number;
  openingHours: OpeningHours[];
}

/** Full replacement of the court's weekly schedule. */
export interface UpdateScheduleRequest {
  slotDurationMinutes: number;
  openingHours: OpeningHours[];
}
