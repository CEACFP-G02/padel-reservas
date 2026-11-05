import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Court, CourtType } from '../../shared/models';
import { API, pageOf, setUpHttp } from '../../testing/http';
import { CourtError, CourtFacade } from './court.facade';

describe('CourtFacade', () => {
  const glass: Court = {
    id: 1,
    name: 'Pista 1',
    type: CourtType.GLASS,
    indoor: true,
    active: true,
  };
  const wall: Court = {
    id: 2,
    name: 'Pista 2',
    type: CourtType.WALL,
    indoor: false,
    active: false,
  };

  let facade: CourtFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    facade = TestBed.inject(CourtFacade);
  });

  afterEach(() => http.verify());

  async function settle<T>(
    promise: Promise<T>,
    url: string,
    method: string,
    respond: (req: ReturnType<HttpTestingController['expectOne']>) => void,
  ) {
    const req = http.expectOne((r) => r.url === url && r.method === method);
    respond(req);
    return promise;
  }

  async function errorOf(promise: Promise<unknown>): Promise<CourtError> {
    try {
      await promise;
    } catch (error) {
      return error as CourtError;
    }
    throw new Error('expected the promise to reject');
  }

  it('starts with empty state', () => {
    expect(facade.courts()).toEqual([]);
    expect(facade.selected()).toBeNull();
    expect(facade.loading()).toBe(false);
    expect(facade.page()).toBeNull();
    expect(facade.error()).toBeNull();
  });

  describe('listCourts', () => {
    it('loads one page of courts, active and inactive, and keeps the page metadata', async () => {
      const loading = facade.listCourts({ page: 1, size: 10 });
      expect(facade.loading()).toBe(true);

      await settle(loading, `${API}/courts`, 'GET', (req) => {
        expect(req.request.params.toString()).toBe('page=1&size=10');
        req.flush({ ...pageOf([glass, wall], 1, 10), totalElements: 12, totalPages: 2 });
      });

      expect(facade.courts()).toEqual([glass, wall]);
      expect(facade.page()).toEqual({ page: 1, size: 10, totalElements: 12, totalPages: 2 });
      expect(facade.loading()).toBe(false);
    });

    it('clears the list and sets a Spanish error when loading fails', async () => {
      await settle(facade.listCourts(), `${API}/courts`, 'GET', (req) =>
        req.flush(pageOf([glass])),
      );

      const failing = facade.listCourts();
      await settle(failing, `${API}/courts`, 'GET', (req) =>
        req.flush(null, { status: 500, statusText: 'Error' }),
      );

      expect(facade.courts()).toEqual([]);
      expect(facade.error()).toBe('No se pudieron cargar las pistas.');
      expect(facade.loading()).toBe(false);
    });
  });

  describe('refresh', () => {
    it('reloads the list with the last filters', async () => {
      await settle(facade.listCourts({ page: 2, size: 10 }), `${API}/courts`, 'GET', (req) =>
        req.flush(pageOf([glass])),
      );

      await settle(facade.refresh(), `${API}/courts`, 'GET', (req) => {
        expect(req.request.params.toString()).toBe('page=2&size=10');
        req.flush(pageOf([glass, wall]));
      });

      expect(facade.courts()).toEqual([glass, wall]);
    });
  });

  it('getCourt sets the selected court', async () => {
    await settle(facade.getCourt(2), `${API}/courts/2`, 'GET', (req) => req.flush(wall));

    expect(facade.selected()).toEqual(wall);
  });

  describe('createCourt', () => {
    const request = { name: 'Pista 3', type: CourtType.GLASS, indoor: false, active: true };
    const created: Court = { id: 3, ...request };

    it('POSTs the court, appends it and resolves with it', async () => {
      const result = await settle(facade.createCourt(request), `${API}/courts`, 'POST', (req) => {
        expect(req.request.body).toEqual(request);
        req.flush(created, { status: 201, statusText: 'Created' });
      });

      expect(result).toEqual(created);
      expect(facade.courts()).toEqual([created]);
    });

    it('rejects a duplicate name (409) as an error on the name field', async () => {
      const failing = facade.createCourt(request);
      http
        .expectOne(`${API}/courts`)
        .flush({ status: 409, message: 'x' }, { status: 409, statusText: 'Conflict' });

      const error = await errorOf(failing);

      expect(error).toBeInstanceOf(CourtError);
      expect(error.fieldErrors).toEqual({ name: 'Ya existe una pista con ese nombre.' });
      expect(facade.courts()).toEqual([]);
    });

    it('rejects a 400 with the fields the API marked', async () => {
      const failing = facade.createCourt(request);
      http
        .expectOne(`${API}/courts`)
        .flush(
          {
            status: 400,
            message: 'Validation failed',
            fieldErrors: { name: 'must not be blank', indoor: 'must not be null' },
          },
          { status: 400, statusText: 'Bad Request' },
        );

      const error = await errorOf(failing);

      expect(error.message).toBe('Revisa los datos de la pista.');
      expect(error.fieldErrors).toEqual({
        name: 'El nombre es obligatorio (máximo 100 caracteres).',
        indoor: 'Indica si la pista es cubierta o exterior.',
      });
    });

    it('rejects any other failure with a generic message', async () => {
      const failing = facade.createCourt(request);
      http.expectOne(`${API}/courts`).flush(null, { status: 500, statusText: 'Error' });

      const error = await errorOf(failing);

      expect(error.message).toBe('No se pudo guardar la pista.');
      expect(error.fieldErrors).toEqual({});
    });
  });

  describe('updateCourt', () => {
    beforeEach(async () => {
      await settle(facade.listCourts(), `${API}/courts`, 'GET', (req) =>
        req.flush(pageOf([glass, wall])),
      );
    });

    it('PATCHes only the given fields and replaces the court in the list and selection', async () => {
      await settle(facade.getCourt(1), `${API}/courts/1`, 'GET', (req) => req.flush(glass));
      const renamed = { ...glass, name: 'Central' };

      const result = await settle(
        facade.updateCourt(1, { name: 'Central' }),
        `${API}/courts/1`,
        'PATCH',
        (req) => {
          expect(req.request.body).toEqual({ name: 'Central' });
          req.flush(renamed);
        },
      );

      expect(result).toEqual(renamed);
      expect(facade.courts()).toEqual([renamed, wall]);
      expect(facade.selected()).toEqual(renamed);
    });

    it('rejects a duplicate name (409) as an error on the name field', async () => {
      const failing = facade.updateCourt(1, { name: 'Pista 2' });
      http
        .expectOne(`${API}/courts/1`)
        .flush({ status: 409, message: 'x' }, { status: 409, statusText: 'Conflict' });

      expect((await errorOf(failing)).fieldErrors).toEqual({
        name: 'Ya existe una pista con ese nombre.',
      });
      expect(facade.courts()).toEqual([glass, wall]);
    });

    it('rejects a 404 with a Spanish message', async () => {
      const failing = facade.updateCourt(9, { name: 'X' });
      http
        .expectOne(`${API}/courts/9`)
        .flush({ status: 404, message: 'x' }, { status: 404, statusText: 'Not Found' });

      expect((await errorOf(failing)).message).toBe('La pista ya no existe.');
    });
  });

  describe('deactivateCourt', () => {
    beforeEach(async () => {
      await settle(facade.listCourts(), `${API}/courts`, 'GET', (req) =>
        req.flush(pageOf([glass, wall])),
      );
    });

    it('DELETEs the court (soft) and marks it inactive', async () => {
      await settle(facade.deactivateCourt(1), `${API}/courts/1`, 'DELETE', (req) =>
        req.flush(null, { status: 204, statusText: 'No Content' }),
      );

      expect(facade.courts()[0]).toEqual({ ...glass, active: false });
    });

    it('rejects a 404 with a Spanish message', async () => {
      const failing = facade.deactivateCourt(9);
      http
        .expectOne(`${API}/courts/9`)
        .flush({ status: 404, message: 'x' }, { status: 404, statusText: 'Not Found' });

      expect((await errorOf(failing)).message).toBe('La pista ya no existe.');
    });
  });
});
