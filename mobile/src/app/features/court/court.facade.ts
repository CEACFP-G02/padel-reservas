import { Injectable, inject, signal } from '@angular/core';

import { Court, CourtQuery } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { CourtApi } from './court.api';

/** CLIENT use cases on courts (read-only info). */
@Injectable({ providedIn: 'root' })
export class CourtFacade {
  private readonly api = inject(CourtApi);

  private readonly _courts = signal<Court[]>([]);
  private readonly _selected = signal<Court | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly courts = this._courts.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: List courts. */
  async listCourts(query: CourtQuery = { active: true }): Promise<void> {
    // TODO: api.list(query) -> _courts.set(page.content) — see docs/api.md#courts--apiv1courts
    todo('CourtFacade.listCourts', 'courts--apiv1courts');
  }

  /** UC: Get court. */
  async getCourt(id: number): Promise<void> {
    // TODO: api.get(id) -> _selected — see docs/api.md#courts--apiv1courts
    todo('CourtFacade.getCourt', 'courts--apiv1courts');
  }
}
