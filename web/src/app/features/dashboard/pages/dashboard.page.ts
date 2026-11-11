import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DashboardFacade } from '../dashboard.facade';

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
    DatePipe,
  ],
  template: `
    <header class="page-header">
      <div>
        <h1>Resumen de hoy</h1>
        @if (facade.summary(); as summary) {
          <p class="date" data-testid="date">{{ summary.date | date: 'fullDate' }}</p>
        }
      </div>
      <span class="spacer"></span>
      <button
        matButton="outlined"
        (click)="load()"
        [disabled]="facade.loading()"
        data-testid="refresh"
      >
        <mat-icon>refresh</mat-icon> Actualizar
      </button>
    </header>

    @if (facade.loading()) {
      <mat-progress-bar mode="indeterminate" />
      @if (!facade.summary()) {
        <p class="muted">Cargando resumen…</p>
        <div class="stats" aria-hidden="true">
          @for (tile of skeletons; track tile) {
            <div class="skeleton stat-skeleton"></div>
          }
        </div>
      }
    }

    @if (facade.error(); as error) {
      <div class="error" role="alert" data-testid="load-error">
        <mat-icon>error_outline</mat-icon>
        <span>{{ error }}</span>
        <span class="spacer"></span>
        <button matButton (click)="load()" data-testid="retry">Reintentar</button>
      </div>
    }

    @if (facade.summary(); as summary) {
      <div class="stats">
        <mat-card appearance="outlined" class="stat teal" data-testid="stat">
          <mat-card-content>
            <span class="icon" aria-hidden="true"><mat-icon>sports_tennis</mat-icon></span>
            <span class="value" data-testid="stat-value">{{ summary.activeCourts }}</span>
            <span class="label" data-testid="stat-label">Pistas activas</span>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined" class="stat teal" data-testid="stat">
          <mat-card-content>
            <span class="icon" aria-hidden="true"><mat-icon>event_available</mat-icon></span>
            <span class="value" data-testid="stat-value">{{ summary.bookingsToday }}</span>
            <span class="label" data-testid="stat-label">Reservas hoy</span>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined" class="stat slate" data-testid="stat">
          <mat-card-content>
            <span class="icon" aria-hidden="true"><mat-icon>date_range</mat-icon></span>
            <span class="value" data-testid="stat-value">{{ summary.upcomingBookings }}</span>
            <span class="label" data-testid="stat-label">Próximos 7 días</span>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined" class="stat amber" data-testid="stat">
          <mat-card-content>
            <span class="icon" aria-hidden="true"><mat-icon>donut_large</mat-icon></span>
            <span class="value" data-testid="stat-value"
              >{{ summary.occupancyRate | number: '1.1-1' }} %</span
            >
            <span class="label" data-testid="stat-label">Ocupación hoy</span>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined" class="stat teal" data-testid="stat">
          <mat-card-content>
            <span class="icon" aria-hidden="true"><mat-icon>euro</mat-icon></span>
            <span class="value" data-testid="stat-value">{{
              summary.revenueToday | currency: 'EUR'
            }}</span>
            <span class="label" data-testid="stat-label">Ingresos hoy</span>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: `
    .date {
      margin: 4px 0 0;
      color: var(--mat-sys-on-surface-variant);
    }
    .date::first-letter {
      text-transform: uppercase;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--app-space-2);
    }
    .stat {
      --tone: var(--mat-sys-primary);
      --tone-soft: var(--mat-sys-primary-container);
      --tone-on-soft: var(--mat-sys-on-primary-container);
      box-shadow: var(--app-shadow);
      border-top: 3px solid var(--tone);
    }
    .stat.amber {
      --tone: var(--app-accent);
      --tone-soft: var(--app-accent-soft);
      --tone-on-soft: var(--app-on-accent-soft);
    }
    .stat.slate {
      --tone: var(--mat-sys-on-surface-variant);
      --tone-soft: var(--app-neutral-soft);
      --tone-on-soft: var(--mat-sys-on-surface-variant);
    }
    mat-card-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: var(--app-space-3) !important;
    }
    .icon {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      margin-bottom: var(--app-space-1);
      border-radius: var(--app-radius-sm);
      background: var(--tone-soft);
      color: var(--tone-on-soft);
    }
    .value {
      font: var(--mat-sys-display-small);
      font-weight: 700;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
    }
    .label {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-title-small);
    }
    .stat-skeleton {
      height: 148px;
      border-radius: var(--app-radius);
    }
  `,
})
export class DashboardPage {
  protected readonly facade = inject(DashboardFacade);
  protected readonly skeletons = [1, 2, 3, 4, 5];

  constructor() {
    this.load();
  }

  protected load(): void {
    void this.facade.getDashboardSummary();
  }
}
