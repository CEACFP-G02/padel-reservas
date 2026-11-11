import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { BookingStatus, CreateBookingRequest } from '../../shared/models';
import { bookingFixture, pageOf } from '../../testing/fixtures';
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
    expect(facade.slotTaken()).toBe(false);
  });

  it('createBooking shows the API message for a rejected request (e.g. a slot outside the schedule)', async () => {
    const pending = facade.createBooking(request);
    http
      .expectOne(`${environment.apiBaseUrl}/bookings`)
      .flush({ status: 400, message: 'Cannot book a slot that has already started' }, { status: 400, statusText: 'Bad Request' });

    await expect(pending).resolves.toBeNull();
    expect(facade.error()).toBe('Ese turno ya no se puede reservar. Vuelve a buscar.');
    expect(facade.slotTaken()).toBe(false);
  });

  it('a new attempt clears the previous conflict', async () => {
    const first = facade.createBooking(request);
    http.expectOne(`${environment.apiBaseUrl}/bookings`).flush(null, { status: 409, statusText: 'Conflict' });
    await first;

    const second = facade.createBooking(request);
    expect(facade.slotTaken()).toBe(false);
    expect(facade.error()).toBeNull();
    http.expectOne(`${environment.apiBaseUrl}/bookings`).flush(bookingFixture());
    await second;
  });

  it('createBooking reports 409 (slot no longer free) as an error', async () => {
    const pending = facade.createBooking(request);
    http
      .expectOne(`${environment.apiBaseUrl}/bookings`)
      .flush({ status: 409, message: 'Slot taken' }, { status: 409, statusText: 'Conflict' });

    await expect(pending).resolves.toBeNull();
    expect(facade.error()).toBe('Ese turno ya no está libre en esa pista. Vuelve a buscar.');
    expect(facade.slotTaken()).toBe(true);
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
    expect(facade.slotTaken()).toBe(false);
  });

  describe('getMyBookings', () => {
    const url = `${environment.apiBaseUrl}/me/bookings`;

    it('loads the client bookings from GET /me/bookings', async () => {
      const bookings = [bookingFixture({ id: 2, date: '2026-06-09' }), bookingFixture({ id: 1 })];
      const pending = facade.getMyBookings({ size: 100 });
      expect(facade.loading()).toBe(true);

      const req = http.expectOne((r) => r.url === url);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('size')).toBe('100');
      req.flush(pageOf(bookings));
      await pending;

      expect(facade.myBookings()).toEqual(bookings);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('clears the list and shows a Spanish error on failure', async () => {
      const first = facade.getMyBookings();
      http.expectOne((r) => r.url === url).flush(pageOf([bookingFixture()]));
      await first;

      const failing = facade.getMyBookings();
      http.expectOne((r) => r.url === url).flush(null, { status: 500, statusText: 'Server Error' });
      await failing;

      expect(facade.myBookings()).toEqual([]);
      expect(facade.error()).toBe('No se pudieron cargar tus reservas.');
      expect(facade.loading()).toBe(false);
    });
  });

  describe('getBooking', () => {
    const url = `${environment.apiBaseUrl}/bookings/5001`;

    it('sets the selected (own) booking from GET /bookings/{id}', async () => {
      const pending = facade.getBooking(5001);
      const req = http.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(bookingFixture());
      await pending;

      expect(facade.selected()).toEqual(bookingFixture());
      expect(facade.error()).toBeNull();
      expect(facade.loading()).toBe(false);
    });

    it('reports a missing (or someone else\'s) booking in Spanish (404)', async () => {
      const pending = facade.getBooking(5001);
      http.expectOne(url).flush({ status: 404, message: 'x' }, { status: 404, statusText: 'Not Found' });
      await pending;

      expect(facade.selected()).toBeNull();
      expect(facade.error()).toBe('No se encontró la reserva.');
    });

    it('reports other failures with a generic error', async () => {
      const pending = facade.getBooking(5001);
      http.expectOne(url).flush(null, { status: 500, statusText: 'Server Error' });
      await pending;

      expect(facade.error()).toBe('No se pudo cargar la reserva.');
    });
  });

  describe('cancelBooking', () => {
    const url = `${environment.apiBaseUrl}/bookings/5001`;

    async function loaded(): Promise<void> {
      const list = facade.getMyBookings();
      http
        .expectOne((r) => r.url === `${environment.apiBaseUrl}/me/bookings`)
        .flush(pageOf([bookingFixture(), bookingFixture({ id: 5002 })]));
      await list;
      const detail = facade.getBooking(5001);
      http.expectOne(url).flush(bookingFixture());
      await detail;
    }

    it('DELETEs the booking and marks it CANCELLED in the list and the detail', async () => {
      await loaded();

      const pending = facade.cancelBooking(5001);
      const req = http.expectOne(url);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await expect(pending).resolves.toBe(true);
      expect(facade.myBookings().map((b) => [b.id, b.status])).toEqual([
        [5001, BookingStatus.CANCELLED],
        [5002, BookingStatus.CONFIRMED],
      ]);
      expect(facade.selected()?.status).toBe(BookingStatus.CANCELLED);
      expect(facade.error()).toBeNull();
    });

    it('surfaces the 24-hour min-notice rejection (409) in Spanish and keeps the booking', async () => {
      await loaded();

      const pending = facade.cancelBooking(5001);
      http.expectOne(url).flush(
        { status: 409, message: 'Bookings can only be cancelled or changed at least 24 hours before they start' },
        { status: 409, statusText: 'Conflict' },
      );

      await expect(pending).resolves.toBe(false);
      expect(facade.error()).toBe(
        'Ya no puedes cancelar esta reserva: solo se puede cancelar hasta 24 horas antes de que empiece.',
      );
      expect(facade.myBookings()[0].status).toBe(BookingStatus.CONFIRMED);
      expect(facade.selected()?.status).toBe(BookingStatus.CONFIRMED);
    });

    it('explains a 409 for a booking that is no longer confirmed', async () => {
      const pending = facade.cancelBooking(5001);
      http
        .expectOne(url)
        .flush({ status: 409, message: 'Booking 5001 is CANCELLED' }, { status: 409, statusText: 'Conflict' });

      await expect(pending).resolves.toBe(false);
      expect(facade.error()).toBe('Esta reserva ya no está confirmada.');
    });

    it('reports other failures with a generic error', async () => {
      const pending = facade.cancelBooking(5001);
      http.expectOne(url).flush(null, { status: 500, statusText: 'Server Error' });

      await expect(pending).resolves.toBe(false);
      expect(facade.error()).toBe('No se pudo cancelar la reserva.');
    });
  });

  describe('paying with credit first, then a card (docs/api.md, "Paying a client booking")', () => {
    const fail = (status: number, message: string) =>
      http.expectOne(`${environment.apiBaseUrl}/bookings`).flush({ status, message }, { status, statusText: 'Error' });

    it('sends the chosen card and keeps how the booking was paid', async () => {
      const paid = bookingFixture({
        payment: { creditsUsed: 0, slotsChargedInMoney: 1, amountCharged: 16, paymentMethodId: 7, chargeReference: 'ch_mock_1' },
      });
      const pending = facade.createBooking({ ...request, paymentMethodId: 7 });
      const req = http.expectOne(`${environment.apiBaseUrl}/bookings`);
      expect(req.request.body).toEqual({ ...request, paymentMethodId: 7 });
      req.flush(paid);

      await expect(pending).resolves.toEqual(paid);
    });

    it('a declined card (402) is "Pago rechazado"', async () => {
      const pending = facade.createBooking({ ...request, paymentMethodId: 7 });
      fail(402, 'Payment declined: the booking was not made');

      await expect(pending).resolves.toBeNull();
      expect(facade.error()).toBe('Pago rechazado: la reserva no se ha hecho. Prueba con otra tarjeta.');
      expect(facade.slotTaken()).toBe(false);
    });

    it('a missing card for the money remainder (400) asks to choose one', async () => {
      const pending = facade.createBooking(request);
      fail(400, 'paymentMethodId is required to pay the 1 slot not covered by credits');

      await pending;
      expect(facade.error()).toBe('No tienes créditos suficientes: elige una tarjeta para pagar el importe.');
    });

    it('a card that is no longer usable (404) says so', async () => {
      const pending = facade.createBooking({ ...request, paymentMethodId: 9 });
      fail(404, 'Payment method 9 not found');

      await pending;
      expect(facade.error()).toBe('Esa tarjeta ya no está disponible. Elige otra.');
    });

    it('a court that is gone (404) keeps its message', async () => {
      const pending = facade.createBooking(request);
      fail(404, 'Court 3 not found');

      await pending;
      expect(facade.error()).toBe('Esa pista ya no está disponible. Vuelve a buscar.');
    });
  });
});
