import { Booking, BookingStatus, CourtDayAvailability, IsoTime } from '../../shared/models';

/**
 * `booked`: taken by a booking; `unavailable`: taken by something else (a court block, or the
 * slot is in the past); `free`: bookable.
 */
export type OccupancyState = 'free' | 'booked' | 'unavailable';

export interface OccupancyCell {
  start: IsoTime;
  end: IsoTime;
  state: OccupancyState;
  /** Present when `state === 'booked'`. */
  booking?: Booking;
  /** Snapshot price of this slot in the booking. */
  price?: number;
}

/** Combines a court-day grid with that day's bookings (non-cancelled bookings take slots). */
export function occupancyGrid(day: CourtDayAvailability, bookings: Booking[]): OccupancyCell[] {
  const taking = bookings.filter(
    (b) => b.courtId === day.courtId && b.date === day.date && b.status !== BookingStatus.CANCELLED,
  );
  return day.slots.map(({ start, end, available }): OccupancyCell => {
    if (available) {
      return { start, end, state: 'free' };
    }
    for (const booking of taking) {
      const slot = booking.slots.find((s) => s.start === start);
      if (slot) {
        return { start, end, state: 'booked', booking, price: slot.price };
      }
    }
    return { start, end, state: 'unavailable' };
  });
}
