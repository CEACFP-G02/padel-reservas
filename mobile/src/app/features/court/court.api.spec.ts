import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CourtType } from '../../shared/models';
import { CourtApi } from './court.api';

describe('CourtApi', () => {
  const base = `${environment.apiBaseUrl}/courts`;
  let api: CourtApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(CourtApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list GETs /courts without params by default', () => {
    api.list().subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
  });

  it('list forwards filters and pagination', () => {
    api.list({ type: CourtType.GLASS, active: true, page: 1, size: 10 }).subscribe();
    const req = http.expectOne((r) => r.url === base);
    expect(req.request.params.get('type')).toBe('GLASS');
    expect(req.request.params.get('active')).toBe('true');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
  });

  it('get GETs /courts/{id}', () => {
    api.get(3).subscribe();
    expect(http.expectOne(`${base}/3`).request.method).toBe('GET');
  });
});
