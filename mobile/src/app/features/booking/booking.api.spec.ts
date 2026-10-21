import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { BookingStatus } from '../../shared/models';
import { BookingApi } from './booking.api';

describe('BookingApi', () => {
  const base = environment.apiBaseUrl;
  let api: BookingApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(BookingApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('create POSTs /bookings without clientId', () => {
    const body = { courtId: 3, date: '2026-06-08', slots: [{ start: '07:00', end: '08:00' }] };
    api.create(body).subscribe();
    const req = http.expectOne(`${base}/bookings`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
  });

  it('myBookings GETs /me/bookings with optional filters', () => {
    api.myBookings({ status: BookingStatus.CONFIRMED, from: '2026-06-01' }).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/me/bookings`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('status')).toBe('CONFIRMED');
    expect(req.request.params.get('from')).toBe('2026-06-01');
    expect(req.request.params.has('to')).toBe(false);
  });

  it('get GETs /bookings/{id}', () => {
    api.get(7).subscribe();
    expect(http.expectOne(`${base}/bookings/7`).request.method).toBe('GET');
  });

  it('cancel DELETEs /bookings/{id}', () => {
    api.cancel(7).subscribe();
    expect(http.expectOne(`${base}/bookings/7`).request.method).toBe('DELETE');
  });
});
