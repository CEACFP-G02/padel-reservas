import { IsoDate, IsoTime, IsoTimestamp, PageRequest } from './common';
import { BookingStatus } from './enums';

export interface TimeRange {
  start: IsoTime;
  end: IsoTime;
}

export interface BookingSlot extends TimeRange {
  price: number;
}

/** Booking response: `POST /bookings`, `GET /bookings/{id}` and the items of `/me/bookings`. */
export interface Booking {
  id: number;
  courtId: number;
  courtName: string;
  userId: number;
  date: IsoDate;
  status: BookingStatus;
  totalPrice: number;
  createdAt: IsoTimestamp;
  slots: BookingSlot[];
}

/**
 * `courtId` is one of the slot's free `courtIds` from `/availability`.
 * `clientId` is taken from the token for a CLIENT, so it is not sent.
 */
export interface CreateBookingRequest {
  courtId: number;
  date: IsoDate;
  slots: TimeRange[];
}

export interface MyBookingsQuery extends PageRequest {
  status?: BookingStatus;
  from?: IsoDate;
  to?: IsoDate;
}
