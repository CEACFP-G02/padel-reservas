import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Client } from '../../shared/models';
import { API, pageOf, setUpHttp } from '../../testing/http';
import { ClientError, UserFacade } from './user.facade';

describe('UserFacade', () => {
  const ana: Client = {
    id: 42,
    name: 'Ana López',
    email: 'ana@padel.test',
    phone: '600000000',
    active: true,
  };
  const bruno: Client = {
    id: 43,
    name: 'Bruno Gil',
    email: 'bruno@padel.test',
    phone: null,
    active: false,
  };
  const url = `${API}/users`;

  let facade: UserFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    facade = TestBed.inject(UserFacade);
  });

  afterEach(() => http.verify());

  async function errorOf(promise: Promise<unknown>): Promise<ClientError> {
    try {
      await promise;
    } catch (error) {
      return error as ClientError;
    }
    throw new Error('expected the promise to reject');
  }

  async function loaded(clients: Client[] = [ana, bruno]): Promise<void> {
    const loading = facade.listClients({ search: 'a' });
    http.expectOne((r) => r.url === url).flush(pageOf(clients));
    await loading;
  }

  it('starts with empty state', () => {
    expect(facade.clients()).toEqual([]);
    expect(facade.selected()).toBeNull();
    expect(facade.page()).toBeNull();
    expect(facade.clientBookings()).toEqual([]);
    expect(facade.clientBookingsPage()).toBeNull();
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  describe('listClients', () => {
    it('loads one page of clients (search) and keeps the page metadata', async () => {
      const loading = facade.listClients({ search: 'ana', page: 1, size: 10 });
      expect(facade.loading()).toBe(true);

      const req = http.expectOne((r) => r.url === url);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.toString()).toBe('search=ana&page=1&size=10');
      req.flush(pageOf([ana], 1, 10));
      await loading;

      expect(facade.clients()).toEqual([ana]);
      expect(facade.page()).toEqual({ page: 1, size: 10, totalElements: 1, totalPages: 1 });
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('refresh repeats the last query', async () => {
      await loaded();

      const refreshing = facade.refresh();
      const req = http.expectOne((r) => r.url === url);
      expect(req.request.params.get('search')).toBe('a');
      req.flush(pageOf([ana]));
      await refreshing;

      expect(facade.clients()).toEqual([ana]);
    });

    it('clears the list and sets a Spanish error on failure', async () => {
      await loaded();

      const failing = facade.listClients();
      http.expectOne((r) => r.url === url).flush(null, { status: 500, statusText: 'Error' });
      await failing;

      expect(facade.clients()).toEqual([]);
      expect(facade.page()).toBeNull();
      expect(facade.error()).toBe('No se pudieron cargar los clientes.');
    });
  });

  it('getClient sets the selected client', async () => {
    const loading = facade.getClient(42);
    http.expectOne(`${url}/42`).flush(ana);
    await loading;

    expect(facade.selected()).toEqual(ana);
  });

  describe('createClient', () => {
    const request = {
      name: 'Carla Ruiz',
      email: 'carla@padel.test',
      password: 's3cret-pass',
      phone: '611',
    };
    const carla: Client = {
      id: 44,
      name: 'Carla Ruiz',
      email: 'carla@padel.test',
      phone: '611',
      active: true,
    };

    it('POSTs the client, appends it and resolves with it', async () => {
      await loaded();

      const creating = facade.createClient(request);
      const req = http.expectOne(url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(carla);

      expect(await creating).toEqual(carla);
      expect(facade.clients()).toEqual([ana, bruno, carla]);
    });

    it('maps a duplicate email (409) to the email field', async () => {
      const creating = facade.createClient(request);
      http
        .expectOne(url)
        .flush(
          { status: 409, message: 'Email carla@padel.test is already registered' },
          { status: 409, statusText: 'Conflict' },
        );

      const error = await errorOf(creating);
      expect(error).toBeInstanceOf(ClientError);
      expect(error.fieldErrors).toEqual({ email: 'Ya existe un usuario con ese email.' });
    });

    it('maps 400 field errors to Spanish messages', async () => {
      const creating = facade.createClient(request);
      http.expectOne(url).flush(
        {
          status: 400,
          message: 'Validation failed',
          fieldErrors: {
            name: 'must not be blank',
            email: 'must be a well-formed email address',
            password: 'size must be between 8 and 72',
            phone: 'size must be between 0 and 30',
          },
        },
        { status: 400, statusText: 'Bad Request' },
      );

      const error = await errorOf(creating);
      expect(error.message).toBe('Revisa los datos del cliente.');
      expect(error.fieldErrors).toEqual({
        name: 'El nombre es obligatorio (máximo 200 caracteres).',
        email: 'Introduce un email válido.',
        password: 'La contraseña debe tener entre 8 y 72 caracteres.',
        phone: 'El teléfono admite como máximo 30 caracteres.',
      });
    });

    it('rejects any other failure with a generic message', async () => {
      const creating = facade.createClient(request);
      http.expectOne(url).flush(null, { status: 500, statusText: 'Error' });

      const error = await errorOf(creating);
      expect(error.message).toBe('No se pudo guardar el cliente.');
      expect(error.fieldErrors).toEqual({});
    });
  });

  describe('updateClient', () => {
    it('PATCHes only the changed fields and replaces the client in the list and the selection', async () => {
      await loaded();
      const select = facade.getClient(42);
      http.expectOne(`${url}/42`).flush(ana);
      await select;
      const updated = { ...ana, phone: '611111111' };

      const updating = facade.updateClient(42, { phone: '611111111' });
      const req = http.expectOne(`${url}/42`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ phone: '611111111' });
      req.flush(updated);

      expect(await updating).toEqual(updated);
      expect(facade.clients()).toEqual([updated, bruno]);
      expect(facade.selected()).toEqual(updated);
    });

    it('maps an email in use (409) to the email field and a missing client (404) to a message', async () => {
      const conflict = facade.updateClient(42, { email: 'bruno@padel.test' });
      http.expectOne(`${url}/42`).flush({ status: 409 }, { status: 409, statusText: 'Conflict' });
      expect((await errorOf(conflict)).fieldErrors.email).toBe(
        'Ya existe un usuario con ese email.',
      );

      const missing = facade.updateClient(42, { phone: '6' });
      http.expectOne(`${url}/42`).flush({ status: 404 }, { status: 404, statusText: 'Not Found' });
      expect((await errorOf(missing)).message).toBe('El cliente ya no existe.');
    });
  });

  describe('deleteClient', () => {
    it('DELETEs the client', async () => {
      const deleting = facade.deleteClient(42);
      const req = http.expectOne(`${url}/42`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await expect(deleting).resolves.toBeUndefined();
    });

    it('rejects a missing client (404) with a Spanish message', async () => {
      const deleting = facade.deleteClient(42);
      http.expectOne(`${url}/42`).flush({ status: 404 }, { status: 404, statusText: 'Not Found' });

      expect((await errorOf(deleting)).message).toBe('El cliente ya no existe.');
    });
  });

  it.todo('listClientBookings loads one page of the client bookings');
});
