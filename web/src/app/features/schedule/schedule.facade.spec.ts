import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Schedule } from '../../shared/models';
import { API, setUpHttp } from '../../testing/http';
import { ScheduleError, ScheduleFacade } from './schedule.facade';

describe('ScheduleFacade', () => {
  const schedule: Schedule = {
    slotMinutes: 60,
    price: 16,
    weekdays: [
      { day: 'MONDAY', open: '08:00', close: '14:00' },
      { day: 'MONDAY', open: '17:00', close: '22:00' },
    ],
  };
  const url = `${API}/courts/3/schedule`;

  let facade: ScheduleFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    http = setUpHttp();
    facade = TestBed.inject(ScheduleFacade);
  });

  afterEach(() => http.verify());

  async function errorOf(promise: Promise<unknown>): Promise<ScheduleError> {
    try {
      await promise;
    } catch (error) {
      return error as ScheduleError;
    }
    throw new Error('expected the promise to reject');
  }

  it('starts with empty state', () => {
    expect(facade.schedule()).toBeNull();
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  describe('getSchedule', () => {
    it('loads the court schedule', async () => {
      const loading = facade.getSchedule(3);
      expect(facade.loading()).toBe(true);

      const req = http.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(schedule);
      await loading;

      expect(facade.schedule()).toEqual(schedule);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('treats 404 as a court without a schedule yet, not as an error', async () => {
      const loading = facade.getSchedule(3);
      http
        .expectOne(url)
        .flush({ status: 404, message: 'x' }, { status: 404, statusText: 'Not Found' });
      await loading;

      expect(facade.schedule()).toBeNull();
      expect(facade.error()).toBeNull();
      expect(facade.loading()).toBe(false);
    });

    it('clears the previous schedule and sets a Spanish error on any other failure', async () => {
      const first = facade.getSchedule(3);
      http.expectOne(url).flush(schedule);
      await first;

      const failing = facade.getSchedule(3);
      http.expectOne(url).flush(null, { status: 500, statusText: 'Error' });
      await failing;

      expect(facade.schedule()).toBeNull();
      expect(facade.error()).toBe('No se pudo cargar el horario.');
    });
  });

  describe('updateSchedule', () => {
    it('PUTs the whole schedule, stores the saved one and resolves with it', async () => {
      const saving = facade.updateSchedule(3, schedule);

      const req = http.expectOne(url);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(schedule);
      req.flush(schedule);

      expect(await saving).toEqual(schedule);
      expect(facade.schedule()).toEqual(schedule);
    });

    it('surfaces a 400 rule violation with the API message', async () => {
      const saving = facade.updateSchedule(3, schedule);
      http
        .expectOne(url)
        .flush(
          { status: 400, message: 'MONDAY 17:00-22:00 overlaps 08:00-18:00' },
          { status: 400, statusText: 'Bad Request' },
        );

      const error = await errorOf(saving);

      expect(error).toBeInstanceOf(ScheduleError);
      expect(error.message).toBe(
        'El servidor rechazó el horario: MONDAY 17:00-22:00 overlaps 08:00-18:00',
      );
      expect(error.fieldErrors).toEqual({});
      expect(facade.schedule()).toBeNull();
    });

    it('maps 400 field errors to Spanish messages on slotMinutes and price', async () => {
      const saving = facade.updateSchedule(3, schedule);
      http.expectOne(url).flush(
        {
          status: 400,
          message: 'Validation failed',
          fieldErrors: {
            slotMinutes: 'must be less than or equal to 240',
            price: 'numeric value out of bounds',
          },
        },
        { status: 400, statusText: 'Bad Request' },
      );

      const error = await errorOf(saving);

      expect(error.message).toBe('Revisa los datos del horario.');
      expect(error.fieldErrors).toEqual({
        slotMinutes: 'La duración del turno debe estar entre 30 y 240 minutos.',
        price: 'El precio debe ser mayor o igual que 0, con 2 decimales como máximo.',
      });
    });

    it('rejects a 404 with a Spanish message', async () => {
      const saving = facade.updateSchedule(3, schedule);
      http
        .expectOne(url)
        .flush({ status: 404, message: 'x' }, { status: 404, statusText: 'Not Found' });

      expect((await errorOf(saving)).message).toBe('La pista ya no existe.');
    });

    it('rejects any other failure with a generic message', async () => {
      const saving = facade.updateSchedule(3, schedule);
      http.expectOne(url).flush(null, { status: 500, statusText: 'Error' });

      expect((await errorOf(saving)).message).toBe('No se pudo guardar el horario.');
    });
  });
});
