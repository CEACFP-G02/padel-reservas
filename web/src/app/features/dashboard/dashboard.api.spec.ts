import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DashboardSummary } from '../../shared/models';
import { API, setUpHttp } from '../../testing/http';
import { DashboardApi } from './dashboard.api';

describe('DashboardApi', () => {
  let api: DashboardApi;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    api = TestBed.inject(DashboardApi);
  });

  afterEach(() => http.verify());

  it('getSummary GETs /dashboard/summary without parameters', () => {
    const summary: DashboardSummary = {
      date: '2026-06-08',
      activeCourts: 4,
      bookingsToday: 12,
      upcomingBookings: 37,
      occupancyRate: 41.7,
      revenueToday: 192,
    };
    let result: DashboardSummary | undefined;
    api.getSummary().subscribe((s) => (result = s));

    const req = http.expectOne(`${API}/dashboard/summary`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush(summary);

    expect(result).toEqual(summary);
  });
});
