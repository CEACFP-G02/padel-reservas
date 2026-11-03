import { Injectable, computed, inject, signal } from '@angular/core';

import { CourtDayAvailability, IsoDate } from '../../shared/models';
import { todo } from '../../shared/util/todo';
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
    // TODO: api.getCourtDay(courtId, date) -> _dayAvailability — see docs/api.md#availability--apiv1availability-
    todo('AvailabilityFacade.getCourtDayAvailability', 'availability--apiv1availability-');
  }
}
