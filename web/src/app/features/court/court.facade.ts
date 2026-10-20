import { Injectable, computed, inject, signal } from '@angular/core';

import { Court, CourtRequest } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { CourtApi } from './court.api';

/** OWNER use cases on courts. One method per use case; state lives in signals. */
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
  readonly activeCourts = computed(() => this._courts().filter((court) => court.active));

  /** UC: List courts. */
  async listCourts(includeInactive = true): Promise<void> {
    // TODO: api.list(includeInactive) -> _courts — see docs/api.md#get-apiv1courts
    todo('CourtFacade.listCourts', 'get-apiv1courts');
  }

  /** UC: Get court. */
  async getCourt(id: number): Promise<void> {
    // TODO: api.get(id) -> _selected — see docs/api.md#get-apiv1courtsid
    todo('CourtFacade.getCourt', 'get-apiv1courtsid');
  }

  /** UC: Create court. */
  async createCourt(request: CourtRequest): Promise<void> {
    // TODO: api.create(request) -> append to _courts — see docs/api.md#post-apiv1courts
    todo('CourtFacade.createCourt', 'post-apiv1courts');
  }

  /** UC: Update court. */
  async updateCourt(id: number, request: CourtRequest): Promise<void> {
    // TODO: api.update(id, request) -> replace in _courts / _selected — see docs/api.md#put-apiv1courtsid
    todo('CourtFacade.updateCourt', 'put-apiv1courtsid');
  }

  /** UC: Deactivate court. */
  async deactivateCourt(id: number): Promise<void> {
    // TODO: api.deactivate(id) -> mark inactive in _courts — see docs/api.md#patch-apiv1courtsiddeactivate
    todo('CourtFacade.deactivateCourt', 'patch-apiv1courtsiddeactivate');
  }
}
