import { IsoDate, IsoDateTime, IsoTime } from './common';

export interface CourtBlock {
  id: number;
  courtId: number;
  date: IsoDate;
  startTime: IsoTime;
  endTime: IsoTime;
  reason: string | null;
  createdAt: IsoDateTime;
}

export interface CourtBlockRequest {
  date: IsoDate;
  startTime: IsoTime;
  endTime: IsoTime;
  reason?: string | null;
}
