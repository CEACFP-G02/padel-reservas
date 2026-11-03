import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AvailabilityResponse } from '../../shared/models';
import { AvailabilityApi } from './availability.api';

describe('AvailabilityApi', () => {
  let api: AvailabilityApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(AvailabilityApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('search GETs /availability with date and courts, returning slots with their free courtIds', () => {
    const response: AvailabilityResponse = {
      requestedDate: '2026-06-08',
      courtsRequested: 2,
      available: true,
      slots: [{ start: '07:00', end: '08:00', courtsFree: 2, courtIds: [1, 3], price: 16 }],
      alternativeDays: [],
    };
    let result: AvailabilityResponse | undefined;
    api.search({ date: '2026-06-08', courts: 2 }).subscribe((value) => (result = value));

    const req = http.expectOne((r) => r.url === `${environment.apiBaseUrl}/availability`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('date')).toBe('2026-06-08');
    expect(req.request.params.get('courts')).toBe('2');
    req.flush(response);

    expect(result?.slots[0].courtIds).toEqual([1, 3]);
  });
});
