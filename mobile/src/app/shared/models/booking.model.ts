import { IsoDate, IsoTime } from './common';
import { BookingStatus } from './enums';

export interface BookingSlot {
  start: IsoTime;
  end: IsoTime;
}

/** docs/api.md does not spell out the booking response; fields follow the create body + status. */
export interface Booking {
  id: number;
  courtId: number;
  clientId: number;
  date: IsoDate;
  slots: BookingSlot[];
  status: BookingStatus;
}

/** `clientId` is taken from the token for a CLIENT, so it is not sent. */
export interface CreateBookingRequest {
  courtId: number;
  date: IsoDate;
  slots: BookingSlot[];
}

export interface MyBookingsQuery {
  status?: BookingStatus;
  from?: IsoDate;
  to?: IsoDate;
}
