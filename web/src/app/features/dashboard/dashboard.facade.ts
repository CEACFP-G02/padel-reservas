import { Injectable, inject, signal } from '@angular/core';

import { DashboardSummary, IsoDate } from '../../shared/models';
import { todo } from '../../shared/util/todo';
import { DashboardApi } from './dashboard.api';

/** OWNER use case: booking KPIs for a date range. */
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly api = inject(DashboardApi);

  private readonly _summary = signal<DashboardSummary | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: Get dashboard summary (server defaults to the current month). */
  async getDashboardSummary(from?: IsoDate, to?: IsoDate): Promise<void> {
    // TODO: api.getSummary(from, to) -> _summary — see docs/api.md#get-apiv1dashboardsummary
    todo('DashboardFacade.getDashboardSummary', 'get-apiv1dashboardsummary');
  }
}
