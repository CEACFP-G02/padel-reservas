import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Court, CourtType, PageResponse } from '../../shared/models';
import { API, pageOf, setUpHttp } from '../../testing/http';
import { CourtApi } from './court.api';

describe('CourtApi', () => {
  const court: Court = { id: 3, name: 'Court 3', type: CourtType.GLASS, indoor: true, active: true };
  let api: CourtApi;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    api = TestBed.inject(CourtApi);
  });

  afterEach(() => http.verify());

  it('list GETs /courts with type/active filters and pagination, returning a page', () => {
    let page: PageResponse<Court> | undefined;
    api.list({ type: CourtType.WALL, active: true, page: 0, size: 50 }).subscribe((p) => (page = p));

    const req = http.expectOne((r) => r.url === `${API}/courts`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.toString()).toBe('type=WALL&active=true&page=0&size=50');
    req.flush(pageOf([court]));

    expect(page?.content).toEqual([court]);
  });

  it('get GETs /courts/{id}', () => {
    api.get(3).subscribe();
    expect(http.expectOne(`${API}/courts/3`).request.method).toBe('GET');
  });

  it('create POSTs { name, type, indoor, active }', () => {
    const body = { name: 'Court 4', type: CourtType.GLASS, indoor: false, active: true };
    api.create(body).subscribe();

    const req = http.expectOne(`${API}/courts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
  });

  it('update PATCHes /courts/{id} with the changed fields', () => {
    api.update(3, { indoor: false }).subscribe();

    const req = http.expectOne(`${API}/courts/3`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ indoor: false });
  });

  it('deactivate DELETEs /courts/{id}', () => {
    api.deactivate(3).subscribe();
    expect(http.expectOne(`${API}/courts/3`).request.method).toBe('DELETE');
  });
});
