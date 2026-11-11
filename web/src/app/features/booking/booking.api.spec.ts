import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Booking, BookingStatus, PageResponse } from '../../shared/models';
import { bookingFixture } from '../../testing/fixtures';
import { API, pageOf, setUpHttp } from '../../testing/http';
import { BookingApi } from './booking.api';

describe('BookingApi', () => {
  let api: BookingApi;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    api = TestBed.inject(BookingApi);
  });

  afterEach(() => http.verify());

  it('list GETs /bookings with filters and pagination, returning a page', () => {
    let page: PageResponse<Booking> | undefined;
    api
      .list({
        date: '2026-06-08',
        courtId: 3,
        userId: 42,
        status: BookingStatus.CONFIRMED,
        page: 1,
        size: 10,
        sort: 'date,desc',
      })
      .subscribe((p) => (page = p));

    const req = http.expectOne((r) => r.url === `${API}/bookings`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.toString()).toBe(
      'date=2026-06-08&courtId=3&userId=42&status=CONFIRMED&page=1&size=10&sort=date,desc',
    );
    req.flush(pageOf([bookingFixture], 1, 10));

    expect(page?.content).toEqual([bookingFixture]);
    expect(page?.page).toBe(1);
  });

  it('get GETs /bookings/{id}', () => {
    api.get(5001).subscribe();
    expect(http.expectOne(`${API}/bookings/5001`).request.method).toBe('GET');
  });

  it('create POSTs a manual booking for a client', () => {
    const body = {
      courtId: 3,
      date: '2026-06-08',
      slots: [{ start: '07:00', end: '08:00' }],
      clientId: 42,
    };
    api.create(body).subscribe();

    const req = http.expectOne(`${API}/bookings`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
  });

  it('cancel DELETEs /bookings/{id}', () => {
    api.cancel(5001).subscribe();
    expect(http.expectOne(`${API}/bookings/5001`).request.method).toBe('DELETE');
  });

  it('reschedule PATCHes /bookings/{id}', () => {
    const body = { date: '2026-06-09', slots: [{ start: '09:00', end: '10:00' }] };
    api.reschedule(5001, body).subscribe();

    const req = http.expectOne(`${API}/bookings/5001`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
  });
});
