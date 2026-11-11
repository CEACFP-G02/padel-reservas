import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CourtDayAvailability } from '../../shared/models';
import { API, setUpHttp } from '../../testing/http';
import { AvailabilityFacade } from './availability.facade';

describe('AvailabilityFacade', () => {
  const day: CourtDayAvailability = {
    courtId: 3,
    courtName: 'Court 3',
    date: '2026-06-08',
    slots: [
      { start: '07:00', end: '08:00', available: false },
      { start: '08:00', end: '09:00', available: true },
      { start: '09:00', end: '10:00', available: true },
      { start: '10:00', end: '11:00', available: true },
    ],
  };
  const url = `${API}/courts/3/availability`;

  let facade: AvailabilityFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    facade = TestBed.inject(AvailabilityFacade);
  });

  afterEach(() => http.verify());

  it('starts with empty state', () => {
    expect(facade.dayAvailability()).toBeNull();
    expect(facade.occupancy()).toBe(0);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('getCourtDayAvailability loads the slot grid for court + date', async () => {
    const loading = facade.getCourtDayAvailability(3, '2026-06-08');
    expect(facade.loading()).toBe(true);

    const req = http.expectOne((r) => r.url === url);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('date')).toBe('2026-06-08');
    req.flush(day);
    await loading;

    expect(facade.dayAvailability()).toEqual(day);
    expect(facade.occupancy()).toBe(0.25);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('clears the grid and reports a missing court in Spanish (404)', async () => {
    const first = facade.getCourtDayAvailability(3, '2026-06-08');
    http.expectOne((r) => r.url === url).flush(day);
    await first;

    const failing = facade.getCourtDayAvailability(3, '2026-06-09');
    http
      .expectOne((r) => r.url === url)
      .flush({ status: 404, message: 'x' }, { status: 404, statusText: 'Not Found' });
    await failing;

    expect(facade.dayAvailability()).toBeNull();
    expect(facade.error()).toBe('La pista no existe.');
    expect(facade.loading()).toBe(false);
  });

  it('reports any other failure with a generic Spanish message', async () => {
    const failing = facade.getCourtDayAvailability(3, '2026-06-08');
    http.expectOne((r) => r.url === url).flush(null, { status: 500, statusText: 'Error' });
    await failing;

    expect(facade.error()).toBe('No se pudo cargar la ocupación.');
  });
});
