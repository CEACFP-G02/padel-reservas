import { Booking, BookingStatus } from '../shared/models';

export const bookingFixture: Booking = {
  id: 5001,
  courtId: 3,
  courtName: 'Court 3',
  userId: 42,
  date: '2026-06-08',
  status: BookingStatus.CONFIRMED,
  totalPrice: 16,
  createdAt: '2026-05-30T10:15:00Z',
  slots: [{ start: '07:00', end: '08:00', price: 16 }],
};
