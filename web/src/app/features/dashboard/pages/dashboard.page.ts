import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { IsoDate } from '../../../shared/models';
import { DashboardFacade } from '../dashboard.facade';

const LONG_DATE = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** `2026-06-08` → `lunes, 8 de junio de 2026` (parsed as a local date, no timezone shift). */
function longDate(date: IsoDate): string {
  const [year, month, day] = date.split('-').map(Number);
  return LONG_DATE.format(new Date(year, month - 1, day));
}

/** OWNER landing page: today's KPIs as stat tiles. */
@Component({
  selector: 'app-dashboard-page',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    CurrencyPipe,
    DecimalPipe,
  ],
  template: `
    <header class="page-header">
      <div>
        <h1>Resumen de hoy</h1>
        @if (date(); as date) {
          <p class="date" data-testid="date">{{ date }}</p>
        }
      </div>
      <span class="spacer"></span>
      <button matButton (click)="load()" [disabled]="facade.loading()" data-testid="refresh">
        <mat-icon>refresh</mat-icon> Actualizar
      </button>
    </header>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
      @if (!facade.summary()) {
        <p class="muted">Cargando resumen…</p>
      }
    }

    @if (facade.error(); as error) {
      <div class="error" role="alert" data-testid="load-error">
        <span>{{ error }}</span>
        <button matButton (click)="load()" data-testid="retry">Reintentar</button>
      </div>
    }

    @if (facade.summary(); as summary) {
      <div class="stats">
        <mat-card appearance="outlined" data-testid="stat">
          <mat-card-content>
            <span class="label" data-testid="stat-label">Pistas activas</span>
            <span class="value" data-testid="stat-value">{{ summary.activeCourts }}</span>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined" data-testid="stat">
          <mat-card-content>
            <span class="label" data-testid="stat-label">Reservas hoy</span>
            <span class="value" data-testid="stat-value">{{ summary.bookingsToday }}</span>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined" data-testid="stat">
          <mat-card-content>
            <span class="label" data-testid="stat-label">Próximos 7 días</span>
            <span class="value" data-testid="stat-value">{{ summary.upcomingBookings }}</span>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined" data-testid="stat">
          <mat-card-content>
            <span class="label" data-testid="stat-label">Ocupación hoy</span>
            <span class="value" data-testid="stat-value"
              >{{ summary.occupancyRate | number: '1.1-1' }} %</span
            >
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined" data-testid="stat">
          <mat-card-content>
            <span class="label" data-testid="stat-label">Ingresos hoy</span>
            <span class="value" data-testid="stat-value">{{
              summary.revenueToday | currency: 'EUR'
            }}</span>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .spacer {
      flex: 1;
    }
    h1 {
      margin-bottom: 0;
    }
    .date,
    .muted {
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }
    .date::first-letter {
      text-transform: uppercase;
    }
    .error {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--mat-sys-error);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    mat-card-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .label {
      color: var(--mat-sys-on-surface-variant);
    }
    .value {
      font: var(--mat-sys-display-small);
    }
  `,
})
export class DashboardPage {
  protected readonly facade = inject(DashboardFacade);
  protected readonly date = computed(() => {
    const summary = this.facade.summary();
    return summary ? longDate(summary.date) : null;
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    void this.facade.getDashboardSummary();
  }
}
