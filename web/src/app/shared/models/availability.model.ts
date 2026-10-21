import { IsoDate, IsoTime } from './common';

export interface AvailabilityQuery {
  date: IsoDate;
  /** Number of courts wanted at the same time. */
  courts: number;
}

/** A slot with enough free courts; `courtsFree === courtIds.length`. */
export interface SlotResponse {
  start: IsoTime;
  end: IsoTime;
  courtsFree: number;
  courtIds: number[];
  price: number;
}

export interface AlternativeDay {
  date: IsoDate;
  freeSlotCount: number;
}

/** `available=false` → `slots` is empty and `alternativeDays` lists nearby days with room. */
export interface AvailabilityResponse {
  requestedDate: IsoDate;
  courtsRequested: number;
  available: boolean;
  slots: SlotResponse[];
  alternativeDays: AlternativeDay[];
}

/** One cell of a single court's day grid (admin calendar). */
export interface CourtSlot {
  start: IsoTime;
  end: IsoTime;
  available: boolean;
}

export interface CourtDayAvailability {
  courtId: number;
  courtName: string;
  date: IsoDate;
  slots: CourtSlot[];
}
