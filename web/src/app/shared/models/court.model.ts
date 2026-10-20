import { CourtType } from './enums';

export interface Court {
  id: number;
  name: string;
  type: CourtType;
  pricePerHour: number;
  active: boolean;
}

/** Body for create and update. */
export interface CourtRequest {
  name: string;
  type: CourtType;
  pricePerHour: number;
}
