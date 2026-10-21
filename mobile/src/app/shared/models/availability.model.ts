import { IsoDate, IsoTime } from './common';

export interface AvailabilityQuery {
  date: IsoDate;
  /** Number of courts the client wants at the same time. */
  courts: number;
}

export interface SlotResponse {
  start: IsoTime;
  end: IsoTime;
  courtsFree: number;
  price: number;
}

export interface AlternativeDay {
  date: IsoDate;
  freeSlotCount: number;
}

/**
 * `available=false` → `slots` is empty and `alternativeDays` holds nearby days with room
 * (±7-day window clamped to today, computed server-side).
 */
export interface AvailabilityResponse {
  requestedDate: IsoDate;
  courtsRequested: number;
  available: boolean;
  slots: SlotResponse[];
  alternativeDays: AlternativeDay[];
}
