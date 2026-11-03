import { IsoTime } from './common';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface WeekdayHours {
  day: DayOfWeek;
  open: IsoTime;
  close: IsoTime;
}

/** Weekly schedule of a court; `price` is per slot of `slotMinutes`. Days not listed are closed. */
export interface Schedule {
  slotMinutes: number;
  price: number;
  weekdays: WeekdayHours[];
}

/** Full replacement (PUT): same shape as the schedule. */
export type UpdateScheduleRequest = Schedule;
