import { IsoDate, IsoTime } from './common';

export interface AvailabilityQuery {
  date: IsoDate;
  /** Number of courts the client wants at the same time. */
  courts: number;
}

export interface SlotResponse {
  start: IsoTime;
  end: IsoTime;
  /** Always `courtIds.length`. */
  courtsFree: number;
  /** Courts free in this slot; the client books one of them via `POST /bookings`. */
  courtIds: number[];
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
