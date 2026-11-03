import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AvailabilityResponse, CourtDayAvailability } from '../../shared/models';
import { API, setUpHttp } from '../../testing/http';
import { AvailabilityApi } from './availability.api';

describe('AvailabilityApi', () => {
  let api: AvailabilityApi;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    api = TestBed.inject(AvailabilityApi);
  });

  afterEach(() => http.verify());

  it('getCourtDay GETs /courts/{id}/availability?date=', () => {
    const day: CourtDayAvailability = {
      courtId: 3,
      courtName: 'Court 3',
      date: '2026-06-08',
      slots: [{ start: '07:00', end: '08:00', available: false }],
    };
    let result: CourtDayAvailability | undefined;
    api.getCourtDay(3, '2026-06-08').subscribe((d) => (result = d));

    const req = http.expectOne((r) => r.url === `${API}/courts/3/availability`);
    expect(req.request.params.get('date')).toBe('2026-06-08');
    req.flush(day);

    expect(result).toEqual(day);
  });

  it('search GETs /availability?date=&courts= with free courtIds per slot', () => {
    const response: AvailabilityResponse = {
      requestedDate: '2026-06-08',
      courtsRequested: 2,
      available: false,
      slots: [],
      alternativeDays: [{ date: '2026-06-09', freeSlotCount: 5 }],
    };
    let result: AvailabilityResponse | undefined;
    api.search({ date: '2026-06-08', courts: 2 }).subscribe((r) => (result = r));

    const req = http.expectOne((r) => r.url === `${API}/availability`);
    expect(req.request.params.toString()).toBe('date=2026-06-08&courts=2');
    req.flush(response);

    expect(result?.alternativeDays[0].freeSlotCount).toBe(5);
  });
});
