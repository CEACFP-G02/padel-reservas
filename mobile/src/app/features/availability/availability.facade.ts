import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AvailabilityQuery, AvailabilityResponse } from '../../shared/models';
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
    this._query.set(query);
    this._loading.set(true);
    this._error.set(null);
    try {
      this._result.set(await firstValueFrom(this.api.search(query)));
    } catch {
      this._result.set(null);
      this._error.set('No se pudo consultar la disponibilidad.');
    } finally {
      this._loading.set(false);
    }
  }

  /** Repeats the last search, e.g. after a booking changed the free slots. */
  async refresh(): Promise<void> {
    const query = this._query();
    if (query) {
      await this.getAvailability(query);
    }
  }
}
