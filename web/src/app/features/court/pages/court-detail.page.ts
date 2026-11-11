import { Component, effect, inject, input, numberAttribute } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { COURT_TYPE_LABELS } from '../court-labels';
import { CourtFacade } from '../court.facade';

@Component({
  selector: 'app-court-detail-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    @if (facade.selected(); as court) {
      <mat-card appearance="outlined" class="detail-card">
        <mat-card-header>
          <mat-card-title>{{ court.name }}</mat-card-title>
          <mat-card-subtitle>
            {{ typeLabels[court.type] }} · {{ court.indoor ? 'Cubierta' : 'Exterior' }} ·
            {{ court.active ? 'Activa' : 'Inactiva' }}
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <a matButton="tonal" [routerLink]="['/courts', court.id, 'schedule']"
            ><mat-icon>schedule</mat-icon> Horario</a
          >
          <a matButton="tonal" [routerLink]="['/courts', court.id, 'blocks']"
            ><mat-icon>event_busy</mat-icon> Bloqueos</a
          >
        </mat-card-actions>
      </mat-card>
    } @else {
      <p class="muted">Cargando pista {{ id() }}…</p>
    }
  `,
  styles: `
    mat-card-actions {
      gap: var(--app-space-1);
      padding: var(--app-space-2);
    }
  `,
})
export class CourtDetailPage {
  protected readonly facade = inject(CourtFacade);
  readonly id = input.required({ transform: numberAttribute });
  protected readonly typeLabels = COURT_TYPE_LABELS;

  constructor() {
    effect(() => void this.facade.getCourt(this.id()));
  }
}
