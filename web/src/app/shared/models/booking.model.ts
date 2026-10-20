import { IsoDate, IsoDateTime, IsoTime } from './common';
import { BookingStatus } from './enums';

export interface BookingSlot {
  startTime: IsoTime;
  endTime: IsoTime;
}

export interface Booking {
  id: number;
  courtId: number;
  courtName: string;
  userId: number;
  userEmail: string;
  date: IsoDate;
  slots: BookingSlot[];
  status: BookingStatus;
  totalPrice: number;
  createdAt: IsoDateTime;
  cancelledAt: IsoDateTime | null;
}

/** Manual booking by the owner on behalf of a client (`userId`). */
export interface CreateBookingRequest {
  courtId: number;
  date: IsoDate;
  slots: BookingSlot[];
  userId: number;
}

/** `courtId` omitted keeps the current court. */
export interface RescheduleBookingRequest {
  courtId?: number;
  date: IsoDate;
  slots: BookingSlot[];
}

export interface BookingFilters {
  courtId?: number;
  date?: IsoDate;
}
