import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CreditPack, CreditTransaction } from '../../shared/models';
import { pageOf } from '../../testing/fixtures';
import { WalletFacade } from './wallet.facade';

const API = environment.apiBaseUrl;

describe('WalletFacade', () => {
  const packs: CreditPack[] = [
    { id: 1, size: 5, price: 75 },
    { id: 2, size: 10, price: 140 },
    { id: 3, size: 15, price: 195 },
    { id: 4, size: 20, price: 240 },
  ];
  const purchase: CreditTransaction = {
    id: 31,
    type: 'PURCHASE',
    credits: 10,
    amount: 140,
    packSize: 10,
    paymentMethodId: 7,
    createdAt: '2026-06-08T10:15:00Z',
  };
  const consumption: CreditTransaction = {
    id: 32,
    type: 'CONSUMPTION',
    credits: -1,
    amount: null,
    packSize: null,
    paymentMethodId: null,
    createdAt: '2026-06-09T18:00:00Z',
  };

  let facade: WalletFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(WalletFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function loadWallet(balance = 9, transactions = [consumption, purchase]) {
    const loading = facade.loadWallet();
    http.expectOne(`${API}/credit/balance`).flush({ balance });
    http.expectOne((r) => r.url === `${API}/credit/transactions`).flush(pageOf(transactions));
    http.expectOne(`${API}/credit-packs`).flush(packs);
    await loading;
  }

  it('starts with an unknown balance and nothing loaded', () => {
    expect(facade.balance()).toBeNull();
    expect(facade.transactions()).toEqual([]);
    expect(facade.packs()).toEqual([]);
  });

  it('loadWallet loads the balance, the recent transactions and the packs with their price per reservation', async () => {
    const loading = facade.loadWallet();
    expect(facade.loading()).toBe(true);
    http.expectOne(`${API}/credit/balance`).flush({ balance: 9 });
    const transactions = http.expectOne((r) => r.url === `${API}/credit/transactions`);
    expect(transactions.request.params.toString()).toBe('page=0&size=10');
    transactions.flush(pageOf([consumption, purchase]));
    http.expectOne(`${API}/credit-packs`).flush(packs);
    await loading;

    expect(facade.balance()).toBe(9);
    expect(facade.transactions()).toEqual([consumption, purchase]);
    expect(facade.packs().map((p) => [p.size, p.pricePerReservation])).toEqual([
      [5, 15],
      [10, 14],
      [15, 13],
      [20, 12],
    ]);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('loadWallet shows a Spanish error when it fails', async () => {
    const loading = facade.loadWallet();
    http.expectOne(`${API}/credit/balance`).flush(null, { status: 500, statusText: 'Error' });
    http.expectOne((r) => r.url === `${API}/credit/transactions`).flush(pageOf([]));
    http.expectOne(`${API}/credit-packs`).flush(packs);
    await loading;

    expect(facade.error()).toBe('No se pudo cargar tu monedero.');
  });

  it('refreshBalance reloads only the balance', async () => {
    const refreshing = facade.refreshBalance();
    http.expectOne(`${API}/credit/balance`).flush({ balance: 4 });
    await refreshing;

    expect(facade.balance()).toBe(4);
  });

  describe('buyPack', () => {
    beforeEach(() => loadWallet(0, []));

    it('POSTs the pack and card, then shows the new balance and the purchase first', async () => {
      const buying = facade.buyPack(2, 7);
      const req = http.expectOne(`${API}/credit/purchases`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ packId: 2, paymentMethodId: 7 });
      req.flush({ balance: 10, transaction: purchase }, { status: 201, statusText: 'Created' });

      await expect(buying).resolves.toBe(true);
      expect(facade.balance()).toBe(10);
      expect(facade.transactions()).toEqual([purchase]);
      expect(facade.purchaseError()).toBeNull();
    });

    it('a declined card (402) is "Pago rechazado" and the balance stays', async () => {
      const buying = facade.buyPack(2, 7);
      http
        .expectOne(`${API}/credit/purchases`)
        .flush({ status: 402, message: 'Payment declined: no credits were added' }, { status: 402, statusText: 'Payment Required' });

      await expect(buying).resolves.toBe(false);
      expect(facade.purchaseError()).toBe('Pago rechazado: no se han añadido créditos. Prueba con otra tarjeta.');
      expect(facade.balance()).toBe(0);
      expect(facade.transactions()).toEqual([]);
    });

    it('a pack or card that no longer exists (404) asks to reload', async () => {
      const buying = facade.buyPack(2, 7);
      http.expectOne(`${API}/credit/purchases`).flush({ status: 404 }, { status: 404, statusText: 'Not Found' });

      await expect(buying).resolves.toBe(false);
      expect(facade.purchaseError()).toBe('Ese pack o esa tarjeta ya no están disponibles. Vuelve a cargar el monedero.');
    });

    it('any other failure has a generic message', async () => {
      const buying = facade.buyPack(2, 7);
      http.expectOne(`${API}/credit/purchases`).flush(null, { status: 500, statusText: 'Error' });

      await buying;
      expect(facade.purchaseError()).toBe('No se pudo completar la compra.');
    });
  });
});
