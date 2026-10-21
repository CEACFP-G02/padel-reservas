import { PageRequest } from './common';
import { CourtType } from './enums';

export interface Court {
  id: number;
  name: string;
  type: CourtType;
  indoor: boolean;
  active: boolean;
}

export interface CourtQuery extends PageRequest {
  type?: CourtType;
  active?: boolean;
}
