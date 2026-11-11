import { BookingStatus } from '../../shared/models';
import { bookingFixture } from '../../testing/fixtures';
import { isUpcoming, splitBookings } from './booking-time';

describe('booking time', () => {
  const now = new Date(2026, 5, 8, 7, 30);

  describe('isUpcoming', () => {
    it('is true for a CONFIRMED booking that has not ended yet (also while being played)', () => {
      expect(isUpcoming(bookingFixture({ date: '2026-06-08' }), now)).toBe(true);
      expect(isUpcoming(bookingFixture({ date: '2026-06-09' }), now)).toBe(true);
    });

    it('is false once the last slot has ended', () => {
      expect(isUpcoming(bookingFixture({ date: '2026-06-08' }), new Date(2026, 5, 8, 8, 0))).toBe(false);
      expect(isUpcoming(bookingFixture({ date: '2026-06-07' }), now)).toBe(false);
    });

    it('is false for a cancelled or completed booking, even in the future', () => {
      expect(isUpcoming(bookingFixture({ date: '2026-06-09', status: BookingStatus.CANCELLED }), now)).toBe(false);
      expect(isUpcoming(bookingFixture({ date: '2026-06-09', status: BookingStatus.COMPLETED }), now)).toBe(false);
    });
  });

  it('splits into upcoming (soonest first) and past (most recent first)', () => {
    const tomorrowLate = bookingFixture({ id: 1, date: '2026-06-09', slots: [{ start: '20:00', end: '21:00', price: 16 }] });
    const tomorrowEarly = bookingFixture({ id: 2, date: '2026-06-09', slots: [{ start: '09:00', end: '10:00', price: 16 }] });
    const inAWeek = bookingFixture({ id: 3, date: '2026-06-15' });
    const yesterday = bookingFixture({ id: 4, date: '2026-06-07' });
    const lastMonth = bookingFixture({ id: 5, date: '2026-05-08' });
    const cancelled = bookingFixture({ id: 6, date: '2026-06-10', status: BookingStatus.CANCELLED });

    const { upcoming, past } = splitBookings([lastMonth, inAWeek, cancelled, yesterday, tomorrowLate, tomorrowEarly], now);

    expect(upcoming.map((b) => b.id)).toEqual([2, 1, 3]);
    expect(past.map((b) => b.id)).toEqual([6, 4, 5]);
  });
});
