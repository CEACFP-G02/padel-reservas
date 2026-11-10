import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DashboardSummary } from '../../shared/models';
import { API, setUpHttp } from '../../testing/http';
import { DashboardFacade } from './dashboard.facade';

describe('DashboardFacade', () => {
  const summary: DashboardSummary = {
    date: '2026-06-08',
    activeCourts: 4,
    bookingsToday: 12,
    upcomingBookings: 37,
    occupancyRate: 41.7,
    revenueToday: 192,
  };
  const url = `${API}/dashboard/summary`;

  let facade: DashboardFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    facade = TestBed.inject(DashboardFacade);
  });

  afterEach(() => http.verify());

  it('starts with empty state', () => {
    expect(facade.summary()).toBeNull();
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it("getDashboardSummary loads today's KPIs and flags loading meanwhile", async () => {
    const loading = facade.getDashboardSummary();
    expect(facade.loading()).toBe(true);

    http.expectOne(url).flush(summary);
    await loading;

    expect(facade.summary()).toEqual(summary);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('clears the summary and sets a Spanish error when loading fails', async () => {
    const first = facade.getDashboardSummary();
    http.expectOne(url).flush(summary);
    await first;

    const failing = facade.getDashboardSummary();
    http.expectOne(url).flush(null, { status: 500, statusText: 'Error' });
    await failing;

    expect(facade.summary()).toBeNull();
    expect(facade.error()).toBe('No se pudo cargar el resumen.');
    expect(facade.loading()).toBe(false);
  });

  it('clears a previous error on a successful reload', async () => {
    const failing = facade.getDashboardSummary();
    http.expectOne(url).flush(null, { status: 500, statusText: 'Error' });
    await failing;

    const retry = facade.getDashboardSummary();
    expect(facade.error()).toBeNull();
    http.expectOne(url).flush(summary);
    await retry;

    expect(facade.summary()).toEqual(summary);
  });
});
