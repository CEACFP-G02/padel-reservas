import { Injectable, computed, inject, signal } from '@angular/core';

import { AvailabilityQuery, AvailabilityResponse } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { AvailabilityApi } from './availability.api';

/** CLIENT use case: search free slots for a date and a number of courts. */
@Injectable({ providedIn: 'root' })
export class AvailabilityFacade {
  private readonly api = inject(AvailabilityApi);

  private readonly _query = signal<AvailabilityQuery | null>(null);
  private readonly _result = signal<AvailabilityResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly query = this._query.asReadonly();
  readonly result = this._result.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** The day is full: render `result().alternativeDays` instead of slots. */
  readonly showAlternatives = computed(() => this._result()?.available === false);

  /** UC: Get availability. */
  async getAvailability(query: AvailabilityQuery): Promise<void> {
    // TODO: _query.set(query); api.search(query) -> _result — see docs/api.md#availability--apiv1availability-
    todo('AvailabilityFacade.getAvailability', 'availability--apiv1availability-');
  }
}
