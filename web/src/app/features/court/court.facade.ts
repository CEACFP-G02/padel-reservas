import { Injectable, computed, inject, signal } from '@angular/core';

import { Court, CourtFilters, CourtRequest, PageMeta, UpdateCourtRequest } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { CourtApi } from './court.api';

/** OWNER use cases on courts. One method per use case; state lives in signals. */
@Injectable({ providedIn: 'root' })
export class CourtFacade {
  private readonly api = inject(CourtApi);

  private readonly _courts = signal<Court[]>([]);
  private readonly _page = signal<PageMeta | null>(null);
  private readonly _selected = signal<Court | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly courts = this._courts.asReadonly();
  readonly page = this._page.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly activeCourts = computed(() => this._courts().filter((court) => court.active));

  /** UC: List courts (type/active filters + pagination). */
  async listCourts(filters: CourtFilters = {}): Promise<void> {
    // TODO: api.list(filters) -> _courts.set(page.content), _page.set(meta) — see docs/api.md#courts--apiv1courts
    todo('CourtFacade.listCourts', 'courts--apiv1courts');
  }

  /** UC: Get court. */
  async getCourt(id: number): Promise<void> {
    // TODO: api.get(id) -> _selected — see docs/api.md#courts--apiv1courts
    todo('CourtFacade.getCourt', 'courts--apiv1courts');
  }

  /** UC: Create court. */
  async createCourt(request: CourtRequest): Promise<void> {
    // TODO: api.create(request) -> append to _courts — see docs/api.md#courts--apiv1courts
    todo('CourtFacade.createCourt', 'courts--apiv1courts');
  }

  /** UC: Update court (PATCH: only the changed fields). */
  async updateCourt(id: number, request: UpdateCourtRequest): Promise<void> {
    // TODO: api.update(id, request) -> replace in _courts / _selected — see docs/api.md#courts--apiv1courts
    todo('CourtFacade.updateCourt', 'courts--apiv1courts');
  }

  /** UC: Deactivate court (DELETE, soft). */
  async deactivateCourt(id: number): Promise<void> {
    // TODO: api.deactivate(id) -> mark inactive in _courts — see docs/api.md#courts--apiv1courts
    todo('CourtFacade.deactivateCourt', 'courts--apiv1courts');
  }
}
