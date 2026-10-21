import { Booking, BookingStatus, Page } from '../shared/models';

/** A booking as returned by the API (docs/api.md#bookings--apiv1bookings). */
export function bookingFixture(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 5001,
    courtId: 3,
    courtName: 'Court 3',
    userId: 42,
    date: '2026-06-08',
    status: BookingStatus.CONFIRMED,
    totalPrice: 16,
    createdAt: '2026-05-30T10:15:00Z',
    slots: [{ start: '07:00', end: '08:00', price: 16 }],
    ...overrides,
  };
}

export function pageOf<T>(content: T[]): Page<T> {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1 };
}
