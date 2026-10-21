import { IsoDate, IsoDateTime, IsoTime, PageRequest } from './common';
import { BookingStatus } from './enums';

export interface TimeRange {
  start: IsoTime;
  end: IsoTime;
}

export interface BookingSlot extends TimeRange {
  price: number;
}

export interface Booking {
  id: number;
  courtId: number;
  courtName: string;
  userId: number;
  userName: string;
  date: IsoDate;
  status: BookingStatus;
  totalPrice: number;
  createdAt: IsoDateTime;
  slots: BookingSlot[];
}

/** Manual booking by the owner on behalf of a client (`clientId` is required for OWNER). */
export interface CreateBookingRequest {
  courtId: number;
  date: IsoDate;
  slots: TimeRange[];
  clientId: number;
}

/** `courtId` omitted keeps the current court. */
export interface RescheduleBookingRequest {
  courtId?: number;
  date: IsoDate;
  slots: TimeRange[];
}

export interface BookingFilters extends PageRequest {
  date?: IsoDate;
  courtId?: number;
  userId?: number;
  status?: BookingStatus;
}
