import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiError, Schedule, UpdateScheduleRequest } from '../../shared/models';
import { ScheduleApi } from './schedule.api';

export type ScheduleField = 'slotMinutes' | 'price';

/** A failed schedule write, with Spanish messages for the form. */
export class ScheduleError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Partial<Record<ScheduleField, string>> = {},
  ) {
    super(message);
  }
}

export const SCHEDULE_FIELD_MESSAGES: Record<ScheduleField, string> = {
  slotMinutes: 'La duración del turno debe estar entre 30 y 240 minutos.',
  price: 'El precio debe ser mayor o igual que 0, con 2 decimales como máximo.',
};

/**
 * Maps the documented errors (docs/api.md#schedule--apiv1courtsidschedule) to Spanish. A 400 is either bean
 * validation (`fieldErrors`) or a rule violation whose message names the offending range; the latter is shown as is.
 */
function scheduleErrorOf(error: unknown): ScheduleError {
  const status = error instanceof HttpErrorResponse ? error.status : undefined;
  if (status === 404) {
    return new ScheduleError('La pista ya no existe.');
  }
  if (status === 400) {
    const body = (error as HttpErrorResponse).error as ApiError | null;
    const apiFields = body?.fieldErrors ?? {};
    if (Object.keys(apiFields).length > 0) {
      const fieldErrors = Object.fromEntries(
        Object.keys(apiFields)
          .filter((field): field is ScheduleField => field in SCHEDULE_FIELD_MESSAGES)
          .map((field) => [field, SCHEDULE_FIELD_MESSAGES[field]]),
      );
      return new ScheduleError('Revisa los datos del horario.', fieldErrors);
    }
    if (body?.message) {
      return new ScheduleError(`El servidor rechazó el horario: ${body.message}`);
    }
  }
  return new ScheduleError('No se pudo guardar el horario.');
}

/** OWNER use cases on a court's weekly schedule. */
@Injectable({ providedIn: 'root' })
export class ScheduleFacade {
  private readonly api = inject(ScheduleApi);

  private readonly _schedule = signal<Schedule | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  /** The loaded schedule; null while loading or when the court has none yet. */
  readonly schedule = this._schedule.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: Get schedule. A 404 means the court has no schedule yet (not an error). */
  async getSchedule(courtId: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._schedule.set(await firstValueFrom(this.api.get(courtId)));
    } catch (error) {
      this._schedule.set(null);
      if (!(error instanceof HttpErrorResponse && error.status === 404)) {
        this._error.set('No se pudo cargar el horario.');
      }
    } finally {
      this._loading.set(false);
    }
  }

  /** UC: Update schedule (PUT: full replacement of slotMinutes, price and weekdays). Rejects with a {@link ScheduleError}. */
  async updateSchedule(courtId: number, request: UpdateScheduleRequest): Promise<Schedule> {
    let saved: Schedule;
    try {
      saved = await firstValueFrom(this.api.update(courtId, request));
    } catch (error) {
      throw scheduleErrorOf(error);
    }
    this._schedule.set(saved);
    return saved;
  }
}
