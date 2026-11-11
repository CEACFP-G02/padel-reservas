import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CourtBlock, CourtBlockRequest } from '../../shared/models';
import { API, setUpHttp } from '../../testing/http';
import { CourtBlockError, CourtBlockFacade } from './courtblock.facade';

describe('CourtBlockFacade', () => {
  const morning: CourtBlock = {
    id: 9,
    courtId: 3,
    date: '2026-06-09',
    start: '07:00',
    end: '09:00',
    reason: 'Mantenimiento',
  };
  const later: CourtBlock = {
    id: 10,
    courtId: 3,
    date: '2026-06-12',
    start: '18:00',
    end: '20:00',
    reason: null,
  };
  const request: CourtBlockRequest = {
    date: '2026-06-10',
    start: '10:00',
    end: '12:00',
    reason: 'Torneo',
  };
  const listUrl = `${API}/courts/3/blocks`;

  let facade: CourtBlockFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    facade = TestBed.inject(CourtBlockFacade);
  });

  afterEach(() => http.verify());

  async function errorOf(promise: Promise<unknown>): Promise<CourtBlockError> {
    try {
      await promise;
    } catch (error) {
      return error as CourtBlockError;
    }
    throw new Error('expected the promise to reject');
  }

  async function loaded(blocks: CourtBlock[] = [morning, later]): Promise<void> {
    const loading = facade.listBlocks(3, { from: '2026-06-08' });
    http.expectOne((r) => r.url === listUrl).flush(blocks);
    await loading;
  }

  const failCreate = async (status: number, body: object) => {
    const creating = facade.createBlock(3, request);
    http.expectOne(listUrl).flush(body, { status, statusText: 'Error' });
    return errorOf(creating);
  };

  it('starts with empty state', () => {
    expect(facade.blocks()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  describe('listBlocks', () => {
    it('loads the court blocks for the range', async () => {
      const loading = facade.listBlocks(3, { from: '2026-06-08' });
      expect(facade.loading()).toBe(true);

      const req = http.expectOne((r) => r.url === listUrl);
      expect(req.request.params.toString()).toBe('from=2026-06-08');
      req.flush([morning, later]);
      await loading;

      expect(facade.blocks()).toEqual([morning, later]);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('refresh repeats the last court and range', async () => {
      await loaded();

      const refreshing = facade.refresh();
      const req = http.expectOne((r) => r.url === listUrl);
      expect(req.request.params.get('from')).toBe('2026-06-08');
      req.flush([later]);
      await refreshing;

      expect(facade.blocks()).toEqual([later]);
    });

    it('clears the list and sets a Spanish error on failure', async () => {
      await loaded();

      const failing = facade.listBlocks(3);
      http.expectOne((r) => r.url === listUrl).flush(null, { status: 500, statusText: 'Error' });
      await failing;

      expect(facade.blocks()).toEqual([]);
      expect(facade.error()).toBe('No se pudieron cargar los bloqueos.');
    });
  });

  describe('createBlock', () => {
    it('POSTs the block, inserts it in date order and resolves with it', async () => {
      await loaded();
      const created: CourtBlock = { id: 11, courtId: 3, ...request, reason: 'Torneo' };

      const creating = facade.createBlock(3, request);
      const req = http.expectOne(listUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(created);

      expect(await creating).toEqual(created);
      expect(facade.blocks().map((b) => b.id)).toEqual([9, 11, 10]);
    });

    it('explains a block over a confirmed booking (409), naming the booking', async () => {
      const error = await failCreate(409, {
        status: 409,
        message: 'Block 10:00-12:00 overlaps booking 5001 (11:00-12:00) on court 3',
      });

      expect(error).toBeInstanceOf(CourtBlockError);
      expect(error.message).toBe(
        'Coincide con la reserva 5001 (11:00–12:00). Cancélala o cámbiala de hora antes de bloquear.',
      );
    });

    it('explains a 409 without details generically', async () => {
      expect((await failCreate(409, { status: 409 })).message).toBe(
        'El bloqueo coincide con una reserva confirmada. Cancélala o cámbiala de hora antes de bloquear.',
      );
    });

    it('maps an end not after the start (400) to the end field', async () => {
      const error = await failCreate(400, {
        status: 400,
        message: 'Block end must be after its start',
      });

      expect(error.fieldErrors).toEqual({
        end: 'La hora de fin debe ser posterior a la de inicio.',
      });
    });

    it('explains a block in the past (400)', async () => {
      const error = await failCreate(400, {
        status: 400,
        message: 'Block 10:00-12:00 on 2026-06-10 is in the past',
      });

      expect(error.message).toBe('Ese bloqueo ya ha terminado. Elige una fecha y hora futuras.');
      expect(error.fieldErrors).toEqual({});
    });

    it('maps 400 validation field errors to Spanish', async () => {
      const error = await failCreate(400, {
        status: 400,
        message: 'Validation failed',
        fieldErrors: { date: 'must not be null', reason: 'size must be between 0 and 255' },
      });

      expect(error.message).toBe('Revisa los datos del bloqueo.');
      expect(error.fieldErrors).toEqual({
        date: 'Indica la fecha.',
        reason: 'El motivo admite como máximo 255 caracteres.',
      });
    });

    it('explains a missing court (404) and any other failure', async () => {
      expect((await failCreate(404, { status: 404 })).message).toBe('La pista ya no existe.');
      expect((await failCreate(500, {})).message).toBe('No se pudo crear el bloqueo.');
    });
  });

  describe('removeBlock', () => {
    it('DELETEs /court-blocks/{id} and drops the block', async () => {
      await loaded();

      const removing = facade.removeBlock(9);
      const req = http.expectOne(`${API}/court-blocks/9`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
      await removing;

      expect(facade.blocks()).toEqual([later]);
    });

    it('rejects a missing block (404) with a Spanish message', async () => {
      const removing = facade.removeBlock(9);
      http
        .expectOne(`${API}/court-blocks/9`)
        .flush({ status: 404 }, { status: 404, statusText: 'Not Found' });

      expect((await errorOf(removing)).message).toBe('El bloqueo ya no existe.');
    });

    it('rejects any other failure with a generic message', async () => {
      const removing = facade.removeBlock(9);
      http.expectOne(`${API}/court-blocks/9`).flush(null, { status: 500, statusText: 'Error' });

      expect((await errorOf(removing)).message).toBe('No se pudo quitar el bloqueo.');
    });
  });
});
