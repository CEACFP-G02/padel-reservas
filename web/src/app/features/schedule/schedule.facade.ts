import { Injectable, inject, signal } from '@angular/core';

import { Schedule, UpdateScheduleRequest } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { ScheduleApi } from './schedule.api';

/** OWNER use cases on a court's weekly schedule. */
@Injectable({ providedIn: 'root' })
export class ScheduleFacade {
  private readonly api = inject(ScheduleApi);

  private readonly _schedule = signal<Schedule | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly schedule = this._schedule.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: Get schedule. */
  async getSchedule(courtId: number): Promise<void> {
    // TODO: api.get(courtId) -> _schedule (404 = court has no schedule yet) — see docs/api.md#get-apiv1courtscourtidschedule
    todo('ScheduleFacade.getSchedule', 'get-apiv1courtscourtidschedule');
  }

  /** UC: Update schedule (full replacement). */
  async updateSchedule(courtId: number, request: UpdateScheduleRequest): Promise<void> {
    // TODO: api.update(courtId, request) -> _schedule — see docs/api.md#put-apiv1courtscourtidschedule
    todo('ScheduleFacade.updateSchedule', 'put-apiv1courtscourtidschedule');
  }
}
