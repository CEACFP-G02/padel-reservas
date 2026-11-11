import { IsoDate, IsoTime } from './common';

export interface CourtBlock {
  id: number;
  courtId: number;
  date: IsoDate;
  start: IsoTime;
  end: IsoTime;
  reason: string | null;
}

export interface CourtBlockRequest {
  date: IsoDate;
  start: IsoTime;
  end: IsoTime;
  reason?: string | null;
}

/** Optional inclusive date range of `GET /courts/{id}/blocks`. */
export interface BlockRange {
  from?: IsoDate;
  to?: IsoDate;
}
