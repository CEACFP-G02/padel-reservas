import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AvailabilityResponse } from '../../shared/models';
import { AvailabilityFacade } from './availability.facade';

describe('AvailabilityFacade', () => {
  const url = `${environment.apiBaseUrl}/availability`;
  const available: AvailabilityResponse = {
    requestedDate: '2026-06-08',
    courtsRequested: 2,
    available: true,
    slots: [{ start: '07:00', end: '08:00', courtsFree: 2, courtIds: [1, 3], price: 16 }],
    alternativeDays: [],
  };
  const full: AvailabilityResponse = {
    requestedDate: '2026-06-08',
    courtsRequested: 2,
    available: false,
    slots: [],
    alternativeDays: [{ date: '2026-06-09', freeSlotCount: 5 }],
  };

  let facade: AvailabilityFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(AvailabilityFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function answer(body: AvailabilityResponse, date = '2026-06-08', courts = '2'): void {
    const req = http.expectOne((r) => r.url === url);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('date')).toBe(date);
    expect(req.request.params.get('courts')).toBe(courts);
    req.flush(body);
  }

  it('starts with no search', () => {
    expect(facade.query()).toBeNull();
    expect(facade.result()).toBeNull();
    expect(facade.loading()).toBe(false);
    expect(facade.showAlternatives()).toBe(false);
  });

  it('getAvailability stores the query and the response, loading meanwhile', async () => {
    const pending = facade.getAvailability({ date: '2026-06-08', courts: 2 });
    expect(facade.loading()).toBe(true);
    expect(facade.query()).toEqual({ date: '2026-06-08', courts: 2 });

    answer(available);
    await pending;

    expect(facade.result()).toEqual(available);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('getAvailability exposes free slots when available=true', async () => {
    const pending = facade.getAvailability({ date: '2026-06-08', courts: 2 });
    answer(available);
    await pending;

    expect(facade.showAlternatives()).toBe(false);
    expect(facade.result()?.slots[0].courtIds).toEqual([1, 3]);
  });

  it('getAvailability exposes alternativeDays when available=false', async () => {
    const pending = facade.getAvailability({ date: '2026-06-08', courts: 2 });
    answer(full);
    await pending;

    expect(facade.showAlternatives()).toBe(true);
    expect(facade.result()?.alternativeDays).toEqual([{ date: '2026-06-09', freeSlotCount: 5 }]);
  });

  it('getAvailability reports a failure in Spanish and clears the old result', async () => {
    const first = facade.getAvailability({ date: '2026-06-08', courts: 2 });
    answer(available);
    await first;

    const second = facade.getAvailability({ date: '2026-06-01', courts: 2 });
    http.expectOne((r) => r.url === url).flush({ status: 400 }, { status: 400, statusText: 'Bad Request' });
    await second;

    expect(facade.result()).toBeNull();
    expect(facade.error()).toBe('No se pudo consultar la disponibilidad.');
    expect(facade.loading()).toBe(false);
  });

  it('refresh repeats the last search', async () => {
    const first = facade.getAvailability({ date: '2026-06-08', courts: 2 });
    answer(available);
    await first;

    const again = facade.refresh();
    answer(full);
    await again;

    expect(facade.result()).toEqual(full);
  });

  it('refresh does nothing before any search', async () => {
    await facade.refresh();
    http.expectNone((r) => r.url === url);
  });
});
