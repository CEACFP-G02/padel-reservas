import { PageRequest } from './common';
import { CourtType } from './enums';

export interface Court {
  id: number;
  name: string;
  type: CourtType;
  indoor: boolean;
  active: boolean;
}

/** Create body; `active` defaults to true server-side. */
export interface CourtRequest {
  name: string;
  type: CourtType;
  indoor: boolean;
  active?: boolean;
}

/** PATCH: only the fields that change. */
export type UpdateCourtRequest = Partial<CourtRequest>;

export interface CourtFilters extends PageRequest {
  type?: CourtType;
  active?: boolean;
}
