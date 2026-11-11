import { Booking, BookingStatus } from '../../shared/models';

/** Local date-time of `HH:mm` on the booking's date (booking times are the club's local time). */
function at(booking: Booking, time: string): Date {
  const [year, month, day] = booking.date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export function bookingStart(booking: Booking): Date {
  return at(booking, booking.slots.map((slot) => slot.start).sort()[0]);
}

function bookingEnd(booking: Booking): Date {
  return at(booking, booking.slots.map((slot) => slot.end).sort().at(-1)!);
}

/** `18:00 – 20:00` for a booking of consecutive slots. */
export function timeRange(booking: Booking): string {
  const starts = booking.slots.map((slot) => slot.start).sort();
  const ends = booking.slots.map((slot) => slot.end).sort();
  return `${starts[0]} – ${ends.at(-1)}`;
}

/** Still to be played (or being played): CONFIRMED and its last slot has not ended. */
export function isUpcoming(booking: Booking, now: Date): boolean {
  return booking.status === BookingStatus.CONFIRMED && bookingEnd(booking) > now;
}

/** Upcoming soonest first; the rest (played, cancelled, completed) most recent first. */
export function splitBookings(bookings: Booking[], now: Date): { upcoming: Booking[]; past: Booking[] } {
  const byStart = (a: Booking, b: Booking) => bookingStart(a).getTime() - bookingStart(b).getTime();
  return {
    upcoming: bookings.filter((b) => isUpcoming(b, now)).sort(byStart),
    past: bookings.filter((b) => !isUpcoming(b, now)).sort((a, b) => byStart(b, a)),
  };
}
