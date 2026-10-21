import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CourtBlock } from '../../shared/models';
import { API, setUpHttp } from '../../testing/http';
import { CourtBlockApi } from './courtblock.api';

describe('CourtBlockApi', () => {
  const block: CourtBlock = { id: 9, courtId: 3, date: '2026-06-08', start: '07:00', end: '09:00', reason: 'Mantenimiento' };
  let api: CourtBlockApi;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    api = TestBed.inject(CourtBlockApi);
  });

  afterEach(() => http.verify());

  it('list GETs /courts/{id}/blocks, optionally for a date', () => {
    let blocks: CourtBlock[] | undefined;
    api.list(3, '2026-06-08').subscribe((b) => (blocks = b));

    const req = http.expectOne((r) => r.url === `${API}/courts/3/blocks`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('date')).toBe('2026-06-08');
    req.flush([block]);

    expect(blocks).toEqual([block]);
  });

  it('create POSTs { date, start, end, reason } to /courts/{id}/blocks', () => {
    const body = { date: '2026-06-08', start: '07:00', end: '09:00', reason: 'Mantenimiento' };
    api.create(3, body).subscribe();

    const req = http.expectOne(`${API}/courts/3/blocks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
  });

  it('remove DELETEs the top-level /court-blocks/{id}', () => {
    api.remove(9).subscribe();
    expect(http.expectOne(`${API}/court-blocks/9`).request.method).toBe('DELETE');
  });
});
