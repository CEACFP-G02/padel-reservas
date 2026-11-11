import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CreditPack } from '../../shared/models';
import { API, setUpHttp } from '../../testing/http';
import { CreditPackError, CreditPackFacade } from './credit-pack.facade';

describe('CreditPackFacade', () => {
  const packs: CreditPack[] = [
    { id: 1, size: 5, price: 75 },
    { id: 2, size: 10, price: 140 },
    { id: 3, size: 15, price: 195 },
    { id: 4, size: 20, price: 240 },
  ];

  let facade: CreditPackFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    facade = TestBed.inject(CreditPackFacade);
  });

  afterEach(() => http.verify());

  async function load(list: CreditPack[] = packs) {
    const loading = facade.listPacks();
    http.expectOne((r) => r.url === `${API}/credit-packs` && r.method === 'GET').flush(list);
    await loading;
  }

  async function errorOf(promise: Promise<unknown>): Promise<CreditPackError> {
    try {
      await promise;
    } catch (error) {
      return error as CreditPackError;
    }
    throw new Error('expected the promise to reject');
  }

  it('starts with empty state', () => {
    expect(facade.packs()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  describe('listPacks', () => {
    it('loads the four packs with the price per reservation', async () => {
      const loading = facade.listPacks();
      expect(facade.loading()).toBe(true);
      http.expectOne(`${API}/credit-packs`).flush(packs);
      await loading;

      expect(facade.packs()).toEqual([
        { id: 1, size: 5, price: 75, pricePerReservation: 15 },
        { id: 2, size: 10, price: 140, pricePerReservation: 14 },
        { id: 3, size: 15, price: 195, pricePerReservation: 13 },
        { id: 4, size: 20, price: 240, pricePerReservation: 12 },
      ]);
      expect(facade.loading()).toBe(false);
    });

    it('rounds the price per reservation to cents', async () => {
      await load([{ id: 3, size: 15, price: 100 }]);

      expect(facade.packs()[0].pricePerReservation).toBe(6.67);
    });

    it('clears the list and sets a Spanish error when loading fails', async () => {
      await load();
      const failing = facade.listPacks();
      http.expectOne(`${API}/credit-packs`).flush(null, { status: 500, statusText: 'Error' });
      await failing;

      expect(facade.packs()).toEqual([]);
      expect(facade.error()).toBe('No se pudieron cargar los packs de crédito.');
      expect(facade.loading()).toBe(false);
    });
  });

  it('refresh reloads the packs', async () => {
    await load();
    const refreshing = facade.refresh();
    http.expectOne(`${API}/credit-packs`).flush([{ id: 1, size: 5, price: 70 }]);
    await refreshing;

    expect(facade.packs()).toEqual([{ id: 1, size: 5, price: 70, pricePerReservation: 14 }]);
  });

  describe('updatePrice', () => {
    beforeEach(() => load());

    it('PATCHes only the price, replaces the pack and resolves with it', async () => {
      const saving = facade.updatePrice(2, 130);
      const req = http.expectOne((r) => r.url === `${API}/credit-packs/2` && r.method === 'PATCH');
      expect(req.request.body).toEqual({ price: 130 });
      req.flush({ id: 2, size: 10, price: 130 });

      expect(await saving).toEqual({ id: 2, size: 10, price: 130 });
      expect(facade.packs()[1]).toEqual({ id: 2, size: 10, price: 130, pricePerReservation: 13 });
    });

    it('rejects a 400 as a Spanish error on the price field', async () => {
      const failing = facade.updatePrice(2, -1);
      http
        .expectOne(`${API}/credit-packs/2`)
        .flush(
          { status: 400, message: 'Validation failed', fieldErrors: { price: 'must be >= 0' } },
          { status: 400, statusText: 'Bad Request' },
        );

      const error = await errorOf(failing);

      expect(error).toBeInstanceOf(CreditPackError);
      expect(error.message).toBe('Revisa el precio del pack.');
      expect(error.fieldErrors).toEqual({
        price: 'El precio debe ser mayor o igual que 0, con 2 decimales como máximo.',
      });
      expect(facade.packs()[1].price).toBe(140);
    });

    it('rejects a 404 with a Spanish message', async () => {
      const failing = facade.updatePrice(9, 10);
      http
        .expectOne(`${API}/credit-packs/9`)
        .flush({ status: 404, message: 'x' }, { status: 404, statusText: 'Not Found' });

      const error = await errorOf(failing);
      expect(error.message).toBe('El pack ya no existe.');
      expect(error.fieldErrors).toEqual({});
    });

    it('rejects any other failure with a generic message', async () => {
      const failing = facade.updatePrice(2, 10);
      http.expectOne(`${API}/credit-packs/2`).flush(null, { status: 500, statusText: 'Error' });

      expect((await errorOf(failing)).message).toBe('No se pudo guardar el precio.');
    });
  });
});
