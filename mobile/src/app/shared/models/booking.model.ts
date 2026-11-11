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
  userName: string;
  date: IsoDate;
  status: BookingStatus;
  totalPrice: number;
  createdAt: IsoTimestamp;
  slots: BookingSlot[];
  /** How it was paid; only in the `201` of a client's `POST /bookings`. */
  payment?: BookingPayment;
}

/** Credit first, then money (docs/api.md, "Paying a client booking"). */
export interface BookingPayment {
  creditsUsed: number;
  slotsChargedInMoney: number;
  amountCharged: number;
  paymentMethodId: number | null;
  chargeReference: string | null;
}

/**
 * `courtId` is one of the slot's free `courtIds` from `/availability`.
 * `clientId` is taken from the token for a CLIENT, so it is not sent.
 * `paymentMethodId` is needed only when credits do not cover every slot.
 */
export interface CreateBookingRequest {
  courtId: number;
  date: IsoDate;
  slots: TimeRange[];
  paymentMethodId?: number;
}

export interface MyBookingsQuery extends PageRequest {
  status?: BookingStatus;
  from?: IsoDate;
  to?: IsoDate;
}
