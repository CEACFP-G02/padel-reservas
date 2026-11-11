import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PaymentMethod } from '../../shared/models';
import { PaymentMethodFacade } from './payment-method.facade';

const URL = `${environment.apiBaseUrl}/payment-methods`;

describe('PaymentMethodFacade', () => {
  const visa: PaymentMethod = { id: 7, brand: 'VISA', last4: '4242', expiry: '2028-12', default: true };
  const master: PaymentMethod = { id: 8, brand: 'MASTERCARD', last4: '4444', expiry: '2029-01', default: false };
  const card = { cardNumber: '5555 5555 5555 4444', expiry: '2029-01', holder: 'Ana López' };

  let facade: PaymentMethodFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(PaymentMethodFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function list(methods: PaymentMethod[] = [visa, master]) {
    const loading = facade.listMethods();
    http.expectOne(URL).flush(methods);
    await loading;
  }

  it('starts empty and not loaded', () => {
    expect(facade.methods()).toEqual([]);
    expect(facade.loaded()).toBe(false);
    expect(facade.defaultMethod()).toBeNull();
  });

  it('lists the cards, the default first', async () => {
    await list([master, visa]);

    expect(facade.methods()).toEqual([visa, master]);
    expect(facade.defaultMethod()).toEqual(visa);
    expect(facade.loaded()).toBe(true);
  });

  it('shows a Spanish error when the list fails', async () => {
    const loading = facade.listMethods();
    http.expectOne(URL).flush(null, { status: 500, statusText: 'Error' });
    await loading;

    expect(facade.error()).toBe('No se pudieron cargar tus tarjetas.');
  });

  describe('addMethod', () => {
    beforeEach(() => list([visa]));

    it('POSTs the card once and lists only what the API returns (brand + last 4)', async () => {
      const adding = facade.addMethod(card);
      const req = http.expectOne(URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(card);
      req.flush(master, { status: 201, statusText: 'Created' });

      await expect(adding).resolves.toBe(true);
      expect(facade.methods()).toEqual([visa, master]);
      expect(JSON.stringify(facade.methods())).not.toContain('5555555555554444');
    });

    it.each([
      ['Invalid card number', 'El número de tarjeta no es válido.'],
      ['Card expired', 'La tarjeta está caducada.'],
      ['Validation failed', 'Revisa los datos de la tarjeta.'],
    ])('maps the 400 %j to Spanish', async (message, spanish) => {
      const adding = facade.addMethod(card);
      http.expectOne(URL).flush({ status: 400, message }, { status: 400, statusText: 'Bad Request' });

      await expect(adding).resolves.toBe(false);
      expect(facade.error()).toBe(spanish);
      expect(facade.methods()).toEqual([visa]);
    });
  });

  it('makeDefault PATCHes { default: true } and moves the new default first', async () => {
    await list();

    const making = facade.makeDefault(8);
    const req = http.expectOne(`${URL}/8`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ default: true });
    req.flush({ ...master, default: true });

    await expect(making).resolves.toBe(true);
    expect(facade.methods()).toEqual([
      { ...master, default: true },
      { ...visa, default: false },
    ]);
  });

  it('removeMethod DELETEs the card and drops it from the list', async () => {
    await list();

    const removing = facade.removeMethod(7);
    const req = http.expectOne(`${URL}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(removing).resolves.toBe(true);
    expect(facade.methods()).toEqual([master]);
    expect(facade.defaultMethod()).toBeNull();
  });

  it('a card that is gone (404) is reported in Spanish', async () => {
    await list();

    const removing = facade.removeMethod(9);
    http.expectOne(`${URL}/9`).flush({ status: 404 }, { status: 404, statusText: 'Not Found' });

    await expect(removing).resolves.toBe(false);
    expect(facade.error()).toBe('Esa tarjeta ya no existe.');
  });
});
