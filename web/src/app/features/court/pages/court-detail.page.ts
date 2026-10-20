import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, input, numberAttribute } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

import { CourtFacade } from '../court.facade';

@Component({
  selector: 'app-court-detail-page',
  imports: [MatCardModule, MatButtonModule, RouterLink, CurrencyPipe],
  template: `
    @if (facade.selected(); as court) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ court.name }}</mat-card-title>
          <mat-card-subtitle>{{ court.type }} · {{ court.pricePerHour | currency: 'EUR' }}/h</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <a matButton [routerLink]="['/courts', court.id, 'schedule']">Horario</a>
          <a matButton [routerLink]="['/courts', court.id, 'blocks']">Bloqueos</a>
        </mat-card-actions>
      </mat-card>
    } @else {
      <p>Cargando pista {{ id() }}…</p>
    }
  `,
})
export class CourtDetailPage {
  protected readonly facade = inject(CourtFacade);
  readonly id = input.required({ transform: numberAttribute });

  constructor() {
    effect(() => void this.facade.getCourt(this.id()));
  }
}
