import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

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

  it('getSummary GETs /dashboard/summary with an optional range', () => {
    api.getSummary('2026-06-01', '2026-06-30').subscribe();

    const req = http.expectOne((r) => r.url === `${API}/dashboard/summary`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.toString()).toBe('from=2026-06-01&to=2026-06-30');
  });
});
