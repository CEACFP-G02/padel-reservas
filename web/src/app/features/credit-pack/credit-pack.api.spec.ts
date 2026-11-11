import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CreditPack } from '../../shared/models';
import { API, setUpHttp } from '../../testing/http';
import { CreditPackApi } from './credit-pack.api';

describe('CreditPackApi', () => {
  const pack: CreditPack = { id: 2, size: 10, price: 140 };
  let api: CreditPackApi;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    api = TestBed.inject(CreditPackApi);
  });

  afterEach(() => http.verify());

  it('list GETs /credit-packs, returning the packs (not paginated)', () => {
    let packs: CreditPack[] | undefined;
    api.list().subscribe((p) => (packs = p));

    const req = http.expectOne(`${API}/credit-packs`);
    expect(req.request.method).toBe('GET');
    req.flush([pack]);

    expect(packs).toEqual([pack]);
  });

  it('updatePrice PATCHes /credit-packs/{id} with only the price', () => {
    let updated: CreditPack | undefined;
    api.updatePrice(2, 130).subscribe((p) => (updated = p));

    const req = http.expectOne(`${API}/credit-packs/2`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ price: 130 });
    req.flush({ ...pack, price: 130 });

    expect(updated).toEqual({ ...pack, price: 130 });
  });
});
