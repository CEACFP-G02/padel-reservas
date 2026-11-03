import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CreateBookingRequest } from '../../shared/models';
import { bookingFixture } from '../../testing/fixtures';
import { BookingFacade } from './booking.facade';

describe('BookingFacade', () => {
  const request: CreateBookingRequest = { courtId: 3, date: '2026-06-08', slots: [{ start: '07:00', end: '08:00' }] };
  let facade: BookingFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(BookingFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts empty', () => {
    expect(facade.myBookings()).toEqual([]);
    expect(facade.selected()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  it('createBooking POSTs the chosen court and slots, and adds the booking to myBookings', async () => {
    const pending = facade.createBooking(request);
    expect(facade.loading()).toBe(true);

    const req = http.expectOne(`${environment.apiBaseUrl}/bookings`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(bookingFixture());

    await expect(pending).resolves.toEqual(bookingFixture());
    expect(facade.myBookings()).toEqual([bookingFixture()]);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('createBooking reports 409 (slot no longer free) as an error', async () => {
    const pending = facade.createBooking(request);
    http
      .expectOne(`${environment.apiBaseUrl}/bookings`)
      .flush({ status: 409, message: 'Slot taken' }, { status: 409, statusText: 'Conflict' });

    await expect(pending).resolves.toBeNull();
    expect(facade.error()).toBe('Ese turno ya no está libre en esa pista. Vuelve a buscar.');
    expect(facade.myBookings()).toEqual([]);
    expect(facade.loading()).toBe(false);
  });

  it('createBooking reports other failures with a generic error', async () => {
    const pending = facade.createBooking(request);
    http
      .expectOne(`${environment.apiBaseUrl}/bookings`)
      .flush(null, { status: 500, statusText: 'Server Error' });

    await expect(pending).resolves.toBeNull();
    expect(facade.error()).toBe('No se pudo crear la reserva.');
  });

  it.todo('getMyBookings loads the client bookings');
  it.todo('getBooking sets the selected (own) booking');
  it.todo('cancelBooking marks the booking CANCELLED');
  it.todo('cancelBooking surfaces the min-notice rejection');
});
