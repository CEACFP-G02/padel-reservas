import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CourtDayAvailability, IsoDate } from '../../shared/models';
import { AvailabilityApi } from './availability.api';

/** OWNER use case: occupancy grid of a court for one day (admin calendar). */
@Injectable({ providedIn: 'root' })
export class AvailabilityFacade {
  private readonly api = inject(AvailabilityApi);

  private readonly _dayAvailability = signal<CourtDayAvailability | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly dayAvailability = this._dayAvailability.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Share of slots already taken (0..1) for the loaded day. */
  readonly occupancy = computed(() => {
    const slots = this._dayAvailability()?.slots ?? [];
    return slots.length ? slots.filter((slot) => !slot.available).length / slots.length : 0;
  });

  /** UC: Get court-day availability. */
  async getCourtDayAvailability(courtId: number, date: IsoDate): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._dayAvailability.set(await firstValueFrom(this.api.getCourtDay(courtId, date)));
    } catch (error) {
      this._dayAvailability.set(null);
      this._error.set(
        error instanceof HttpErrorResponse && error.status === 404
          ? 'La pista no existe.'
          : 'No se pudo cargar la ocupación.',
      );
    } finally {
      this._loading.set(false);
    }
  }
}
