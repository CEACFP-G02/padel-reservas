import { Booking, BookingStatus, CourtDayAvailability } from '../../shared/models';
import { bookingFixture } from '../../testing/fixtures';
import { occupancyGrid } from './occupancy-grid';

describe('occupancyGrid', () => {
  const day: CourtDayAvailability = {
    courtId: 3,
    courtName: 'Court 3',
    date: '2026-06-08',
    slots: [
      { start: '07:00', end: '08:00', available: false },
      { start: '08:00', end: '09:00', available: false },
      { start: '09:00', end: '10:00', available: true },
      { start: '10:00', end: '11:00', available: false },
    ],
  };
  const twoHours: Booking = {
    ...bookingFixture,
    totalPrice: 34,
    slots: [
      { start: '07:00', end: '08:00', price: 16 },
      { start: '08:00', end: '09:00', price: 18 },
    ],
  };

  it('marks free slots, booked slots with their booking and slot price, and other taken slots', () => {
    expect(occupancyGrid(day, [twoHours])).toEqual([
      { start: '07:00', end: '08:00', state: 'booked', booking: twoHours, price: 16 },
      { start: '08:00', end: '09:00', state: 'booked', booking: twoHours, price: 18 },
      { start: '09:00', end: '10:00', state: 'free' },
      { start: '10:00', end: '11:00', state: 'unavailable' },
    ]);
  });

  it('ignores cancelled bookings and bookings of another court or day', () => {
    const bookings: Booking[] = [
      { ...twoHours, status: BookingStatus.CANCELLED },
      { ...twoHours, id: 1, courtId: 4 },
      { ...twoHours, id: 2, date: '2026-06-09' },
    ];

    expect(occupancyGrid(day, bookings).map((cell) => cell.state)).toEqual([
      'unavailable',
      'unavailable',
      'free',
      'unavailable',
    ]);
  });

  it('keeps COMPLETED bookings on the grid (they still took the slot)', () => {
    const completed = { ...twoHours, status: BookingStatus.COMPLETED };

    expect(occupancyGrid(day, [completed])[0]).toMatchObject({
      state: 'booked',
      booking: completed,
    });
  });

  it('returns an empty grid for a closed day', () => {
    expect(occupancyGrid({ ...day, slots: [] }, [twoHours])).toEqual([]);
  });
});
