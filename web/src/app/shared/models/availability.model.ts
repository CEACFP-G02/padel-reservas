import { IsoDate, IsoTime } from './common';

export interface SlotResponse {
  startTime: IsoTime;
  endTime: IsoTime;
  available: boolean;
}

export interface CourtDayAvailability {
  courtId: number;
  courtName: string;
  date: IsoDate;
  slots: SlotResponse[];
}

export interface AvailabilityResponse {
  date: IsoDate;
  courts: CourtDayAvailability[];
  /** Only filled when `date` has no free slot at all. */
  nearbyAvailableDays: IsoDate[];
}
