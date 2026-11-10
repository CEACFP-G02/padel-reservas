import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { DashboardSummary } from '../../shared/models';
import { DashboardApi } from './dashboard.api';

/** OWNER use case: today's KPIs for the panel's landing page. */
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly api = inject(DashboardApi);

  private readonly _summary = signal<DashboardSummary | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** UC: Get dashboard summary. */
  async getDashboardSummary(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._summary.set(await firstValueFrom(this.api.getSummary()));
    } catch {
      this._summary.set(null);
      this._error.set('No se pudo cargar el resumen.');
    } finally {
      this._loading.set(false);
    }
  }
}
