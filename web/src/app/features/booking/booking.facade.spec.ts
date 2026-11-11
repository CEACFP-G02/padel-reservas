import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Booking, BookingStatus } from '../../shared/models';
import { bookingFixture } from '../../testing/fixtures';
import { API, pageOf, setUpHttp } from '../../testing/http';
import { BookingError, BookingFacade } from './booking.facade';

describe('BookingFacade', () => {
  const other: Booking = {
    ...bookingFixture,
    id: 5002,
    slots: [{ start: '09:00', end: '10:00', price: 16 }],
  };
  const url = `${API}/bookings`;

  let facade: BookingFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    facade = TestBed.inject(BookingFacade);
  });

  afterEach(() => http.verify());

  async function errorOf(promise: Promise<unknown>): Promise<BookingError> {
    try {
      await promise;
    } catch (error) {
      return error as BookingError;
    }
    throw new Error('expected the promise to reject');
  }

  async function loaded(bookings: Booking[]): Promise<void> {
    const loading = facade.listBookings({ date: '2026-06-08', courtId: 3 });
    http.expectOne((r) => r.url === url).flush(pageOf(bookings));
    await loading;
  }

  it('starts with empty state', () => {
    expect(facade.bookings()).toEqual([]);
    expect(facade.selected()).toBeNull();
    expect(facade.filters()).toEqual({});
    expect(facade.page()).toBeNull();
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  describe('listBookings', () => {
    it('loads one page of bookings for the given filters and keeps the page metadata', async () => {
      const filters = { date: '2026-06-08', courtId: 3, size: 100 };
      const loading = facade.listBookings(filters);
      expect(facade.loading()).toBe(true);
      expect(facade.filters()).toEqual(filters);

      const req = http.expectOne((r) => r.url === url);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('date')).toBe('2026-06-08');
      expect(req.request.params.get('courtId')).toBe('3');
      expect(req.request.params.get('size')).toBe('100');
      req.flush(pageOf([bookingFixture, other], 0, 100));
      await loading;

      expect(facade.bookings()).toEqual([bookingFixture, other]);
      expect(facade.page()).toEqual({ page: 0, size: 100, totalElements: 2, totalPages: 1 });
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('clears the list and sets a Spanish error on failure', async () => {
      await loaded([bookingFixture]);

      const failing = facade.listBookings({});
      http.expectOne((r) => r.url === url).flush(null, { status: 500, statusText: 'Error' });
      await failing;

      expect(facade.bookings()).toEqual([]);
      expect(facade.page()).toBeNull();
      expect(facade.error()).toBe('No se pudieron cargar las reservas.');
      expect(facade.loading()).toBe(false);
    });
  });

  describe('cancelBooking', () => {
    it('(DELETE, 204) marks the booking CANCELLED locally', async () => {
      await loaded([bookingFixture, other]);

      const cancelling = facade.cancelBooking(5001);
      const req = http.expectOne(`${url}/5001`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
      await cancelling;

      expect(facade.bookings().map((b) => [b.id, b.status])).toEqual([
        [5001, BookingStatus.CANCELLED],
        [5002, BookingStatus.CONFIRMED],
      ]);
    });

    it('rejects a 409 (not CONFIRMED any more) with a Spanish message', async () => {
      const cancelling = facade.cancelBooking(5001);
      http
        .expectOne(`${url}/5001`)
        .flush(
          { status: 409, message: 'Booking 5001 is CANCELLED' },
          { status: 409, statusText: 'Conflict' },
        );

      const error = await errorOf(cancelling);
      expect(error).toBeInstanceOf(BookingError);
      expect(error.message).toBe('La reserva ya no está confirmada; no se puede cancelar.');
    });

    it('rejects a 404 with a Spanish message', async () => {
      const cancelling = facade.cancelBooking(5001);
      http
        .expectOne(`${url}/5001`)
        .flush({ status: 404, message: 'x' }, { status: 404, statusText: 'Not Found' });

      expect((await errorOf(cancelling)).message).toBe('La reserva ya no existe.');
    });

    it('rejects any other failure with a generic message and leaves the list untouched', async () => {
      await loaded([bookingFixture]);

      const cancelling = facade.cancelBooking(5001);
      http.expectOne(`${url}/5001`).flush(null, { status: 500, statusText: 'Error' });

      expect((await errorOf(cancelling)).message).toBe('No se pudo cancelar la reserva.');
      expect(facade.bookings()[0].status).toBe(BookingStatus.CONFIRMED);
    });
  });

  it.todo('getBooking sets the selected booking');
  it.todo('createBooking appends the booking and reports 409 as an error');
  it.todo('rescheduleBooking replaces date/slots');
});
